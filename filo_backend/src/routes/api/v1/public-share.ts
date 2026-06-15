import { Router } from "express";
import { ShareController } from "@/controllers/share";

const router = Router();
const controller = new ShareController();

// GET /api/v1/public/share/:token
router.get("/:token", controller.getInfo);

// GET /api/v1/public/share/:token/folders/:folderId
router.get("/:token/folders/:folderId", controller.getFolderContents);

// GET /api/v1/public/share/:token/download           (file share)
router.get("/:token/download", controller.download);

// GET /api/v1/public/share/:token/files/:fileId/download (folder share)
router.get("/:token/files/:fileId/download", controller.download);

export default router;