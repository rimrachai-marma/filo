import { Router } from "express";
import { auth } from "@/middleware/auth";
import { validateRequestBody } from "@/middleware/validation";
import { createFileShareLinkSchema, createFolderShareLinkSchema } from "@/schema";
import { ShareController } from "@/controllers/share";

const router = Router();
const controller = new ShareController();

router.use(auth);

// POST /api/v1/share/files
router.post("/files", validateRequestBody(createFileShareLinkSchema), controller.createFileShare);

// POST /api/v1/share/folders
router.post("/folders", validateRequestBody(createFolderShareLinkSchema), controller.createFolderShare);

router.get("/", controller.shareLinks);
router.delete("/:id", controller.revoke);

export default router;