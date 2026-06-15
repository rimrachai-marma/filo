// Handles two upload strategies:
//   1. Simple presigned PUT  — files up to ~100 MB, single request
//   2. Multipart presigned   — files 100 MB – 500 MB, parallel chunks, resumable
//
// Security model:
//   • AWS/R2 credentials NEVER leave the server
//   • Each presigned URL is scoped to one exact object key + expiry window
//   • Plan enforcement (storage quota, file type, per-folder limit) runs BEFORE
//     any URL is issued, so the client cannot bypass it by calling R2 directly
//   • The confirm step re-validates ownership and session integrity

import path from "path";
import { randomUUID } from "crypto";

import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2, R2_BUCKET } from "@/lib/r2";
import { PlanEnforcementService } from "./plan";
import ErrorResponse from "@/utils/errorResponse";
import type { PrismaClient } from "@/generated/prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────
// Files at or below this threshold use a single presigned PUT
const SIMPLE_UPLOAD_THRESHOLD_BYTES = 100 * 1024 * 1024; // 100 MB

// Each multipart chunk is exactly this size except the last part
export const PART_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB  (R2 min is 5 MB)

// How long a simple presigned PUT URL stays valid
const SIMPLE_URL_TTL_SECONDS = 15 * 60; // 15 minutes

// How long each part presigned URL stays valid
const PART_URL_TTL_SECONDS = 60 * 60; // 1 hour

// Multipart sessions that are still PENDING expire after this period
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresignSimpleResult {
  strategy: "simple";
  uploadUrl: string;   // PUT directly to this URL
  r2Key: string;
  expiresIn: number;   // seconds
}

export interface PresignMultipartResult {
  strategy: "multipart";
  sessionId: string;
  uploadId: string;    // R2 multipart UploadId (opaque to client)
  r2Key: string;
  totalParts: number;
  partSize: number;    // bytes per part
  parts: PartPresignResult[];
}

export interface PartPresignResult {
  partNumber: number;  // 1-based
  uploadUrl: string;
  sizeBytes?: number;
  uploadedAt?: string; // when this part was already uploaded (resume)
  etag?: string;       // when already uploaded
}

export interface ConfirmSimpleUploadInput {
  r2Key: string;
  folderId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ConfirmMultipartUploadInput {
  sessionId: string;
  parts: { partNumber: number; etag: string }[];
}

// ─── UploadService ────────────────────────────────────────────────────────────
export class UploadService {
  private plan: PlanEnforcementService;

  constructor(private prisma: PrismaClient) {
    this.plan = new PlanEnforcementService(prisma);
  }

  // ─── Simple presigned PUT for files ≤ 100 MB ────────────────────────────────
  async presignSimpleUpload(
    userId: string,
    folderId: string,
    fileName: string,
    mimeType: string,
    sizeBytes: number,
  ): Promise<PresignSimpleResult> {
    if (sizeBytes > SIMPLE_UPLOAD_THRESHOLD_BYTES) {
      throw new ErrorResponse(
        `File is too large for simple upload (max ${SIMPLE_UPLOAD_THRESHOLD_BYTES / 1024 / 1024} MB). Use multipart upload instead.`,
        400,
      );
    }

    await this._enforcePlan(userId, folderId, mimeType, sizeBytes);

    const r2Key = this._buildKey(userId, fileName);

    const url = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        ContentType: mimeType,
        ContentLength: sizeBytes,
      }),
      { expiresIn: SIMPLE_URL_TTL_SECONDS },
    );

    return {
      strategy: "simple",
      uploadUrl: url,
      r2Key,
      expiresIn: SIMPLE_URL_TTL_SECONDS,
    };
  }

  // Called after the client finishes the PUT to R2.
  async confirmSimpleUpload(userId: string, input: ConfirmSimpleUploadInput) {
    const { r2Key, folderId, fileName, mimeType, sizeBytes } = input;

    if (!r2Key.startsWith(`${userId}/`)) {
      throw new ErrorResponse("Invalid r2Key for this user.", 403);
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new ErrorResponse("Folder not found.", 404);

    const check = await this.plan.checkFileUploadAllowed(userId, folderId, mimeType, sizeBytes);
    if (!check.allowed) throw new ErrorResponse(check.reason || "Upload not allowed.", 403);

    return this.prisma.file.create({
      data: {
        name: fileName,
        userId,
        folderId,
        type: check.fileType!,
        sizeBytes,
        path: r2Key,
        mimeType,
      },
    });
  }

  // Multipart presigned upload ─────────────────────────────────────────────────
  //
  // Use for files > 100 MB (up to 500 MB).
  //
  // Flow:
  //   a) initMultipartUpload()       — creates R2 multipart session + DB session record
  //   b) getPartUrls()               — returns presigned URLs for specific parts
  //                                    (supports resume: already-uploaded parts included)
  //   c) confirmMultipartUpload()    — completes R2 multipart + saves File to DB
  //   d) abortMultipartUpload()      — cleanup on client cancel / error
  //
  // Resume support:
  //   • DB stores which (partNumber, etag) pairs have been confirmed by the client.
  //   • On reconnect, getPartUrls() returns fresh URLs only for missing parts.
  //   • Already-uploaded parts are included with their etag so the client can
  //     pass them straight to confirmMultipartUpload().

  async initMultipartUpload(
    userId: string,
    folderId: string,
    fileName: string,
    mimeType: string,
    sizeBytes: number,
  ): Promise<PresignMultipartResult> {
    await this._enforcePlan(userId, folderId, mimeType, sizeBytes);

    const r2Key = this._buildKey(userId, fileName);
    const totalParts = Math.ceil(sizeBytes / PART_SIZE_BYTES);

    // Create the multipart upload in R2
    const { UploadId } = await r2.send(
      new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        ContentType: mimeType,
      }),
    );

    if (!UploadId) throw new ErrorResponse("Failed to initiate multipart upload.", 500);

    // Persist session for resume later
    const session = await this.prisma.multipartUploadSession.create({
      data: {
        userId,
        folderId,
        uploadId: UploadId,
        r2Key,
        fileName,
        mimeType,
        sizeBytes,
        totalParts,
        status: "PENDING",
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    // Presign all part URLs upfront
    const parts = await this._presignParts(r2Key, UploadId, totalParts);

    return {
      strategy: "multipart" as const,
      sessionId: session.id,
      uploadId: UploadId,
      r2Key,
      totalParts,
      partSize: PART_SIZE_BYTES,
      parts,
    };
  }

  // Resume: returns fresh presigned URLs for parts not yet uploaded.
  // Already-uploaded parts are returned with etag (no new URL needed).
  async resumeMultipartUpload(userId: string, sessionId: string): Promise<PresignMultipartResult> {
    const session = await this._getOwnedSession(userId, sessionId);

    if (session.status !== "PENDING") {
      throw new ErrorResponse(
        `Upload session is ${session.status.toLowerCase()} and cannot be resumed.`,
        400,
      );
    }

    if (session.expiresAt < new Date()) {
      throw new ErrorResponse("Upload session has expired. Please start a new upload.", 410);
    }

    // Fetch parts already confirmed by the client (stored in DB)
    const uploadedParts = await this.prisma.multipartUploadPart.findMany({
      where: { sessionId },
      orderBy: { partNumber: "asc" },
    });

    const uploadedSet = new Map(uploadedParts.map((p) => [p.partNumber, p]));
    const missingPartNumbers: number[] = [];

    for (let i = 1; i <= session.totalParts; i++) {
      if (!uploadedSet.has(i)) missingPartNumbers.push(i);
    }

    // Presign only missing parts
    const freshUrls = await this._presignSpecificParts(session.r2Key, session.uploadId, missingPartNumbers);
    const freshMap = new Map(freshUrls.map((p) => [p.partNumber, p]));

    // Merge: already-uploaded parts don't need a URL
    const parts: PartPresignResult[] = [];
    for (let i = 1; i <= session.totalParts; i++) {
      const done = uploadedSet.get(i);

      if (done) {
        parts.push({
          partNumber: i,
          uploadUrl: "", // already uploaded, client skips this
          uploadedAt: done.uploadedAt.toISOString(),
          etag: done.etag,
          sizeBytes: done.sizeBytes,
        });
      } else {
        parts.push(freshMap.get(i)!);
      }
    }

    return {
      strategy: "multipart",
      sessionId: session.id,
      uploadId: session.uploadId,
      r2Key: session.r2Key,
      totalParts: session.totalParts,
      partSize: PART_SIZE_BYTES,
      parts,
    };
  }

  // Client calls this after uploading each part to save its etag.
  // This makes individual parts durable across reconnects.
  async confirmPart(
    userId: string,
    sessionId: string,
    partNumber: number,
    etag: string,
    sizeBytes: number,
  ) {
    const session = await this._getOwnedSession(userId, sessionId);

    if (session.status !== "PENDING") {
      throw new ErrorResponse("Upload session is no longer active.", 400);
    }

    if (partNumber < 1 || partNumber > session.totalParts) {
      throw new ErrorResponse(`Invalid partNumber. Must be 1–${session.totalParts}.`, 400);
    }

    // Validate the reported size matches what this part should be.
    // All parts except the last must equal PART_SIZE_BYTES; the last part
    // is whatever remainder is left over.
    const expectedSize = partNumber < session.totalParts ? PART_SIZE_BYTES : session.sizeBytes - PART_SIZE_BYTES * (session.totalParts - 1);

    if (sizeBytes !== expectedSize) {
      throw new ErrorResponse(
        `Invalid sizeBytes for part ${partNumber}. Expected ${expectedSize}, got ${sizeBytes}.`,
        400,
      );
    }

    // Upsert so retrying the same part is idempotent
    await this.prisma.multipartUploadPart.upsert({
      where: { sessionId_partNumber: { sessionId, partNumber } },
      create: { sessionId, partNumber, etag, sizeBytes },
      update: { etag, sizeBytes, uploadedAt: new Date() },
    });

    // Return how many parts are done (client uses this for progress)
    const doneCount = await this.prisma.multipartUploadPart.count({ where: { sessionId } });
    return {
      partNumber,
      doneCount,
      totalParts: session.totalParts,
      percentComplete: Math.round((doneCount / session.totalParts) * 100),
    };
  }

  // Complete: tell R2 to assemble the parts and save the File record to DB.
  async confirmMultipartUpload(
    userId: string,
    input: ConfirmMultipartUploadInput,
  ) {
    const { sessionId, parts } = input;
    const session = await this._getOwnedSession(userId, sessionId);

    if (session.status !== "PENDING") {
      throw new ErrorResponse(
        `Upload session is already ${session.status.toLowerCase()}.`,
        400,
      );
    }

    if (parts.length !== session.totalParts) {
      throw new ErrorResponse(
        `Expected ${session.totalParts} parts but received ${parts.length}.`,
        400,
      );
    }

    const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i]!.partNumber !== i + 1) {
        throw new ErrorResponse(`Missing part ${i + 1}.`, 400);
      }
      if (!sorted[i]!.etag) {
        throw new ErrorResponse(`Missing ETag for part ${i + 1}.`, 400);
      }
    }

    // Tell R2 to assemble the object
    await r2.send(
      new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: session.r2Key,
        UploadId: session.uploadId,
        MultipartUpload: {
          Parts: sorted.map((p) => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          })),
        },
      }),
    );

    // From this point on, session.r2Key refers to a COMPLETED object in R2
    // (not a pending multipart upload). Any cleanup below must DELETE the
    // object, not abort a multipart upload — the UploadId is no longer valid.

    // Get the REAL assembled size from R2 — never trust the client-declared
    // session.sizeBytes for quota/storage accounting, since a client could
    // under-report the size at init time to slip past plan checks while
    // actually uploading a much larger file.
    let actualSizeBytes: number;
    try {
      const head = await r2.send(
        new HeadObjectCommand({ Bucket: R2_BUCKET, Key: session.r2Key }),
      );
      if (head.ContentLength == null) {
        throw new Error("R2 did not return ContentLength.");
      }
      actualSizeBytes = head.ContentLength;
    } catch (err) {
      // Object was assembled but we couldn't verify its size — it already
      // exists as a completed object in R2, so delete it (not abort).
      await this._safeDeleteObject(session.r2Key);
      throw new ErrorResponse("Failed to verify uploaded file size.", 500);
    }

    // Plan check using the ACTUAL size, not the client-declared one
    const check = await this.plan.checkFileUploadAllowed(
      userId,
      session.folderId,
      session.mimeType,
      actualSizeBytes,
    );
    if (!check.allowed) {
      // R2 object is now assembled and exists — delete it (not abort).
      await this._safeDeleteObject(session.r2Key);
      throw new ErrorResponse(check.reason || "Upload not allowed.", 403);
    }

    const [file] = await this.prisma.$transaction([
      this.prisma.file.create({
        data: {
          name: session.fileName,
          userId,
          folderId: session.folderId,
          type: check.fileType!,
          sizeBytes: actualSizeBytes,
          path: session.r2Key,
          mimeType: session.mimeType,
        },
      }),

      this.prisma.multipartUploadSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED" },
      }),
    ]);

    return file;
  }

  // Client abort (user cancelled) or server-side cleanup.
  async abortMultipartUpload(userId: string, sessionId: string) {
    const session = await this._getOwnedSession(userId, sessionId);

    if (session.status === "COMPLETED") {
      throw new ErrorResponse("Cannot abort a completed upload.", 400);
    }

    // Tell R2 to free the partial upload
    await r2.send(
      new AbortMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: session.r2Key,
        UploadId: session.uploadId,
      }),
    ).catch(() => {
      // R2 might already have cleaned it up — not fatal
    });

    await this.prisma.multipartUploadSession.update({
      where: { id: sessionId },
      data: { status: "ABORTED" },
    });
  }

  // List pending sessions for a user (dashboard / resume picker)
  async listPendingSessions(userId: string) {
    const sessions = await this.prisma.multipartUploadSession.findMany({
      where: { userId, status: "PENDING", expiresAt: { gt: new Date() } },
      include: {
        parts: {
          select: { partNumber: true, sizeBytes: true, uploadedAt: true },
          orderBy: { partNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((s) => ({
      sessionId: s.id,
      fileName: s.fileName,
      mimeType: s.mimeType,
      sizeBytes: s.sizeBytes,
      totalParts: s.totalParts,
      uploadedParts: s.parts.length,
      percentComplete: Math.round((s.parts.length / s.totalParts) * 100),
      uploadedBytes: s.parts.reduce((acc, p) => acc + p.sizeBytes, 0),
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    }));
  }

  // ─── Private helpers ──────────────────────────────────────────────────────
  private _buildKey(userId: string, fileName: string): string {
    const ext = path.extname(fileName);
    return `${userId}/${randomUUID()}${ext}`;
  }

  private async _enforcePlan(userId: string, folderId: string, mimeType: string, sizeBytes: number) {
    const folder = await this.prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new ErrorResponse("Folder not found.", 404);

    const check = await this.plan.checkFileUploadAllowed(userId, folderId, mimeType, sizeBytes);
    if (!check.allowed) throw new ErrorResponse(check.reason || "Upload not allowed.", 403);
  }

  private async _presignParts(
    r2Key: string,
    uploadId: string,
    totalParts: number,
  ): Promise<PartPresignResult[]> {
    return this._presignSpecificParts(r2Key, uploadId, Array.from({ length: totalParts }, (_, i) => i + 1));
  }

  private async _presignSpecificParts(
    r2Key: string,
    uploadId: string,
    partNumbers: number[],
  ): Promise<PartPresignResult[]> {
    // Presign in parallel (all at once is fine; AWS SDK is non-blocking)
    return Promise.all(
      partNumbers.map(async (partNumber) => {
        const url = await getSignedUrl(
          r2,
          new UploadPartCommand({
            Bucket: R2_BUCKET,
            Key: r2Key,
            UploadId: uploadId,
            PartNumber: partNumber,
          }),
          { expiresIn: PART_URL_TTL_SECONDS },
        );
        return { partNumber, uploadUrl: url };
      }),
    );
  }

  private async _getOwnedSession(userId: string, sessionId: string) {
    const session = await this.prisma.multipartUploadSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) throw new ErrorResponse("Upload session not found.", 404);

    return session;
  }

  // Cleanup for an object that has ALREADY been assembled via
  // CompleteMultipartUploadCommand (or a simple PUT) — the UploadId is no
  // longer valid at this point, so we must delete the object directly.
  private async _safeDeleteObject(r2Key: string) {
    await r2.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }),
    ).catch(() => {});
  }
}