import express from "express";

import apiRoutesV1 from "./api/v1";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "✅ Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use("/api/v1", apiRoutesV1);

export default router;
