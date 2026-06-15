"use client";

import { useState, useRef, useCallback } from "react";
import { post, get, del } from "@/lib/api.client";

// ─── Constants ────────────────────────────────────────────────────────────────
const SIMPLE_THRESHOLD = 100 * 1024 * 1024; // 100 MB — above this uses multipart
const MAX_PARALLEL_PARTS = 3; // upload 3 chunks at once
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000; // doubles each retry

// ─── Types ────────────────────────────────────────────────────────────────────
export type UploadStatus = "idle" | "uploading" | "completing" | "done" | "error" | "aborted";

export interface UploadItem {
  id: string;
  file: File;
  folderId: string;
  status: UploadStatus;
  progress: number; // 0–100
  uploadedBytes: number;
  totalBytes: number;
  speed: number; // bytes/sec, live
  timeRemaining: number | null; // seconds
  error: string | null;
  sessionId?: string; // multipart session id
  strategy?: "simple" | "multipart";
}

export interface PendingSession {
  sessionId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  totalParts: number;
  uploadedParts: number;
  percentComplete: number;
  uploadedBytes: number;
  expiresAt: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function partExpectedSize(partNumber: number, totalParts: number, partSize: number, fileSize: number): number {
  if (partNumber < totalParts) return partSize;
  return fileSize - partSize * (totalParts - 1); // remainder for the last part
}

// PUT a Blob to a presigned R2 URL via XHR (so we get upload progress events).
// Returns the ETag header from the response.
// Accepts an optional onAbortRegister callback so the caller can store the xhr
// reference and call xhr.abort() later.
function putToR2(
  url: string,
  body: Blob,
  onProgress?: (deltaBytes: number) => void,
  onAbortRegister?: (xhr: XMLHttpRequest) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", body.type || "application/octet-stream");

    // Register the xhr with the caller before sending so it can be aborted
    // even if the request completes very quickly.
    onAbortRegister?.(xhr);

    if (onProgress) {
      let lastLoaded = 0;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const delta = e.loaded - lastLoaded;
          lastLoaded = e.loaded;
          onProgress(delta);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag") ?? "";
        resolve(etag);
      } else {
        reject(new Error(`R2 PUT failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(body);
  });
}

// Retry wrapper — exponential back-off, up to MAX_RETRIES attempts.
// Passes the onAbortRegister through so the active xhr is always tracked.
async function putWithRetry(
  url: string,
  body: Blob,
  onProgress?: (delta: number) => void,
  onAbortRegister?: (xhr: XMLHttpRequest) => void,
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await putToR2(url, body, onProgress, onAbortRegister);
    } catch (err) {
      // Don't retry an intentional abort — propagate immediately.
      if (err instanceof Error && err.message === "Upload aborted") throw err;
      if (attempt === MAX_RETRIES) throw err;

      await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
    }
  }
  throw new Error("Unreachable");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);

  // speed tracker: accumulates bytes and last-seen timestamp per upload item
  const speedTrackers = useRef<Map<string, { bytes: number; ts: number }>>(new Map());

  // Tracks the currently active XHR for each upload item id.
  // For simple uploads this holds one XHR; for multipart it holds the XHR of
  // whichever part is currently in-flight (last one registered wins, which is
  // fine since parts in the same batch replace each other and abort stops all).
  // Using a separate ref per-batch slot (see multipartUpload) gives finer
  // control, but a single "latest active" ref per item is enough to stop the
  // upload immediately when the user clicks Cancel.
  const activeXhrs = useRef<Map<string, XMLHttpRequest>>(new Map());

  // ─── Atomic item updater ─────────────────────────────────────────────────
  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  // ─── Live speed + progress ───────────────────────────────────────────────
  const onDelta = useCallback((id: string, delta: number) => {
    const now = Date.now();
    const tracker = speedTrackers.current.get(id);
    if (!tracker) return;

    // Always accumulate — the triggering delta must be included in the speed
    // sample so it isn't silently dropped when the recalc fires.
    tracker.bytes += delta;
    const elapsed = (now - tracker.ts) / 1000;

    // Recalculate speed every 0.5s so the display isn't jittery.
    // uploadedBytes and progress are always updated regardless of the gate
    // so the progress bar stays smooth even between recalcs.
    const shouldRecalc = elapsed >= 0.5;
    let newSpeed: number | undefined;

    if (shouldRecalc) {
      newSpeed = tracker.bytes / elapsed;
      // Reset accumulator AFTER computing speed so the full window is used.
      tracker.bytes = 0;
      tracker.ts = now;
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;

        const uploaded = it.uploadedBytes + delta;
        const remaining = it.totalBytes - uploaded;

        const speed = newSpeed ?? it.speed;
        const timeRemaining =
          newSpeed !== undefined ? (newSpeed > 0 ? Math.ceil(remaining / newSpeed) : null) : it.timeRemaining;

        return {
          ...it,
          uploadedBytes: uploaded,
          progress: Math.min(99, Math.round((uploaded / it.totalBytes) * 100)),
          speed,
          timeRemaining,
        };
      }),
    );
  }, []);

  // ─── Simple upload (file ≤ 100 MB) ──────────────────────────────────────
  const simpleUpload = useCallback(
    async (itemId: string, file: File, folderId: string) => {
      try {
        // 1. Get a presigned PUT URL from the backend
        const presignRes = await post<{
          uploadUrl: string;
          r2Key: string;
          expiresIn: number;
        }>({
          path: "/upload/presign",
          body: {
            folderId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        });

        if (presignRes.status === "error") {
          updateItem(itemId, { status: "error", error: presignRes.message });
          return;
        }

        const { uploadUrl, r2Key } = presignRes.data!;

        // 2. PUT file body directly to R2, registering the xhr so it can be
        //    aborted by abortUpload() if the user clicks Cancel.
        await putWithRetry(
          uploadUrl,
          file,
          (delta) => onDelta(itemId, delta),
          (xhr) => activeXhrs.current.set(itemId, xhr),
        );

        // 3. Tell backend to register the file in the DB
        updateItem(itemId, { status: "completing", progress: 99 });

        const confirmRes = await post({
          path: "/upload/confirm",
          body: {
            r2Key,
            folderId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        });

        if (confirmRes.status === "error") {
          updateItem(itemId, { status: "error", error: confirmRes.message });
          return;
        }

        updateItem(itemId, { status: "done", progress: 100, timeRemaining: null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";

        updateItem(itemId, {
          status: msg === "Upload aborted" ? "aborted" : "error",
          error: msg === "Upload aborted" ? null : msg,
        });
      } finally {
        speedTrackers.current.delete(itemId);
        activeXhrs.current.delete(itemId);
      }
    },
    [updateItem, onDelta],
  );

  // ─── Multipart upload (file > 100 MB) ───────────────────────────────────
  const multipartUpload = useCallback(
    async (itemId: string, file: File, folderId: string, existingSessionId?: string) => {
      try {
        type PartInfo = {
          partNumber: number;
          uploadUrl: string;
          sizeBytes?: number;
          etag?: string;
          uploadedAt?: string;
        };

        let sessionId: string;
        let totalParts: number;
        let partSize: number;
        let parts: PartInfo[];

        if (existingSessionId) {
          // ── Resume ──────────────────────────────────────────────────────
          const res = await get<{
            sessionId: string;
            totalParts: number;
            partSize: number;
            parts: PartInfo[];
          }>({ path: `/upload/multipart/${existingSessionId}/resume` });

          if (res.status === "error") {
            updateItem(itemId, { status: "error", error: res.message });
            return;
          }

          ({ sessionId, totalParts, partSize, parts } = res.data!);

          const doneParts = parts.filter((p) => p.uploadedAt);

          const uploadedBytes = doneParts.reduce(
            (sum, p) => sum + (p.sizeBytes ?? partExpectedSize(p.partNumber, totalParts, partSize, file.size)),
            0,
          );

          updateItem(itemId, {
            sessionId,
            uploadedBytes,
            progress: Math.round((doneParts.length / totalParts) * 100),
          });
        } else {
          // ── New session ──────────────────────────────────────────────────
          const res = await post<{
            sessionId: string;
            totalParts: number;
            partSize: number;
            parts: PartInfo[];
          }>({
            path: "/upload/multipart/init",
            body: {
              folderId,
              fileName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
            },
          });

          if (res.status === "error") {
            updateItem(itemId, { status: "error", error: res.message });
            return;
          }

          ({ sessionId, totalParts, partSize, parts } = res.data!);
          updateItem(itemId, { sessionId, strategy: "multipart" });
        }

        // Already-done parts (from resume)
        const completedParts: { partNumber: number; etag: string }[] = parts
          .filter((p) => p.uploadedAt && p.etag)
          .map((p) => ({ partNumber: p.partNumber, etag: p.etag! }));

        const pendingParts = parts.filter((p) => !p.uploadedAt);

        // Upload in parallel batches of MAX_PARALLEL_PARTS.
        // Each part registers its xhr under the item id so abortUpload() can
        // kill the most-recently-started part. Parts within the same batch
        // overwrite each other in the map — that's acceptable because
        // xhr.abort() on one doesn't affect the others; we rely on the
        // "Upload aborted" error propagating out of Promise.all to stop the
        // whole batch and exit the outer loop.
        for (let i = 0; i < pendingParts.length; i += MAX_PARALLEL_PARTS) {
          const batch = pendingParts.slice(i, i + MAX_PARALLEL_PARTS);

          await Promise.all(
            batch.map(async (part) => {
              const chunk = file.slice((part.partNumber - 1) * partSize, part.partNumber * partSize);

              const etag = await putWithRetry(
                part.uploadUrl,
                chunk,
                (delta) => onDelta(itemId, delta),
                (xhr) => activeXhrs.current.set(itemId, xhr),
              );

              // Persist this part immediately — survives reconnect
              await post({
                path: `/upload/multipart/${sessionId}/parts`,
                body: { partNumber: part.partNumber, etag, sizeBytes: chunk.size },
              });

              completedParts.push({ partNumber: part.partNumber, etag });
            }),
          );
        }

        // Ask R2 to assemble + register File in DB
        updateItem(itemId, { status: "completing", progress: 99 });

        const completeRes = await post({
          path: `/upload/multipart/${sessionId}/complete`,
          body: { parts: completedParts },
        });

        if (completeRes.status === "error") {
          updateItem(itemId, { status: "error", error: completeRes.message });
          return;
        }

        updateItem(itemId, { status: "done", progress: 100, timeRemaining: null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updateItem(itemId, {
          status: msg === "Upload aborted" ? "aborted" : "error",
          error: msg === "Upload aborted" ? null : msg,
        });
      } finally {
        speedTrackers.current.delete(itemId);
        activeXhrs.current.delete(itemId);
      }
    },
    [updateItem, onDelta],
  );

  // ─── Public: one upload ────────────────────────────────────────────
  const upload = useCallback(
    (file: File, folderId: string): string => {
      const id = crypto.randomUUID();
      const isMultipart = file.size > SIMPLE_THRESHOLD;

      setItems((prev) => [
        ...prev,
        {
          id,
          file,
          folderId,
          status: "uploading",
          progress: 0,
          uploadedBytes: 0,
          totalBytes: file.size,
          speed: 0,
          timeRemaining: null,
          error: null,
          strategy: isMultipart ? "multipart" : "simple",
        },
      ]);

      speedTrackers.current.set(id, { bytes: 0, ts: Date.now() });

      if (isMultipart) {
        multipartUpload(id, file, folderId);
      } else {
        simpleUpload(id, file, folderId);
      }

      return id;
    },
    [simpleUpload, multipartUpload],
  );

  // ─── Public: many files at once ───────────────────────────────────
  const uploads = useCallback(
    (files: FileList | File[], folderId: string) => {
      Array.from(files).forEach((f) => upload(f, folderId));
    },
    [upload],
  );

  // ─── Public: cancel / abort ──────────────────────────────────────────────
  const abortUpload = useCallback(
    async (itemId: string) => {
      // 1. Immediately kill the in-flight XHR so bytes stop being sent.
      //    This causes putToR2's "abort" event listener to fire and reject
      //    the promise with "Upload aborted", which propagates up through
      //    putWithRetry and out of simpleUpload / multipartUpload into the
      //    catch block, which sets status: "aborted".
      const xhr = activeXhrs.current.get(itemId);
      if (xhr) {
        xhr.abort();
        // The map entry is cleaned up in the finally block of the upload
        // function, but delete it here too in case the finally hasn't run yet.
        activeXhrs.current.delete(itemId);
      }

      // 2. Tell the backend to clean up the R2 multipart session so partial
      //    data doesn't linger in the bucket.
      const item = items.find((i) => i.id === itemId);
      if (item?.sessionId) {
        await del({ path: `/upload/multipart/${item.sessionId}` }).catch(() => {});
      }

      // 3. If the upload had already finished before we got here (race between
      //    the user clicking Cancel and the XHR completing), the status will
      //    already be "done" and the xhr.abort() above was a no-op. Don't
      //    overwrite a successful completion.
      setItems((prev) =>
        prev.map((it) => (it.id === itemId && it.status !== "done" ? { ...it, status: "aborted" } : it)),
      );
    },
    [items],
  );

  // ─── Public: dismiss finished items ─────────────────────────────────────
  const dismissItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const dismissAll = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.status === "uploading" || i.status === "completing"));
  }, []);

  // ─── Public: resume from a pending session ───────────────────────────────
  const loadPendingSessions = useCallback(async () => {
    const res = await get<PendingSession[]>({ path: "/upload/multipart/sessions" });
    if (res.status === "success") setPendingSessions(res.data);
  }, []);

  const resumeSession = useCallback(
    (session: PendingSession, file: File) => {
      const id = crypto.randomUUID();

      setItems((prev) => [
        ...prev,
        {
          id,
          file,
          folderId: "",
          status: "uploading",
          progress: session.percentComplete,
          uploadedBytes: session.uploadedBytes,
          totalBytes: session.sizeBytes,
          speed: 0,
          timeRemaining: null,
          error: null,
          sessionId: session.sessionId,
          strategy: "multipart",
        },
      ]);

      speedTrackers.current.set(id, { bytes: 0, ts: Date.now() });
      setPendingSessions((prev) => prev.filter((s) => s.sessionId !== session.sessionId));

      multipartUpload(id, file, "", session.sessionId);
    },
    [multipartUpload],
  );

  // ─── Public: retry a failed upload ───────────────────────────────────────
  const retryUpload = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item || item.status !== "error") return;

      updateItem(itemId, { status: "uploading", error: null, speed: 0, timeRemaining: null });

      speedTrackers.current.set(itemId, { bytes: 0, ts: Date.now() });

      if (item.strategy === "multipart") {
        multipartUpload(itemId, item.file, item.folderId, item.sessionId);
      } else {
        // simple uploads have no partial state — restart from scratch
        updateItem(itemId, { uploadedBytes: 0 });
        simpleUpload(itemId, item.file, item.folderId);
      }
    },
    [items, updateItem, multipartUpload, simpleUpload],
  );

  // ─── Derived ──────────────────────────────────────────────────────────────
  const activeCount = items.filter((i) => i.status === "uploading" || i.status === "completing").length;

  const hasFinished = items.some((i) => i.status === "done" || i.status === "error" || i.status === "aborted");

  return {
    items,
    pendingSessions,
    activeCount,
    hasFinished,
    upload,
    uploads,
    abortUpload,
    dismissItem,
    dismissAll,
    loadPendingSessions,
    resumeSession,
    retryUpload,
  };
}
