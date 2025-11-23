// src/routes/upload.js
import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import verifyToken from "../middlewares/verifyToken.js";

const router = Router();

function makeStorage(subFolder) {
  const dir = path.resolve(process.cwd(), "public", "uploads", subFolder);
  fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_, __, cb) => cb(null, dir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname);
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, safe);
    },
  });
}

const imageUpload = multer({ storage: makeStorage("images") });
const videoUpload = multer({ storage: makeStorage("videos") });

router.get("/ping", (_, res) => res.json({ ok: true }));

// Upload ảnh: field name = "file"
router.post("/image", verifyToken, imageUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file" });
  return res.json({
    success: true,
    url: `/uploads/images/${req.file.filename}`,
    filename: req.file.filename,
  });
});

// Upload video: field name = "file"
router.post("/video", verifyToken, videoUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file" });
  return res.json({
    success: true,
    url: `/uploads/videos/${req.file.filename}`,
    filename: req.file.filename,
  });
});

export default router; // ⬅️ BẮT BUỘC: export default một Router
