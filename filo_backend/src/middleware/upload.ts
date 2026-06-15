import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Storage engine that puts files in /uploads/<user ID>/
// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     const dir = path.join(UPLOAD_DIR, req.user?.id!);

//     fs.mkdirSync(dir, { recursive: true });

//     cb(null, dir);
//   },

//   filename(req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, `${randomUUID()}${ext}`);
//   },
// });

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/webm",
  "application/pdf",
];

const TEMP_UPLOAD_DIR = process.env.TEMP_UPLOAD_DIR || "./temp_uploads";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(TEMP_UPLOAD_DIR, req.user?.id!);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const maxBytes = parseInt(process.env.MAX_FILE_SIZE_BYTES || "524288000"); // 500 MB default

export const upload = multer({
  storage,
  // storage: multer.memoryStorage(), // buffer in memory; R2 receives the buffer directly

  limits: { fileSize: maxBytes },

  fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type "${file.mimetype}" is not supported.`));
  },
});
