// src/routes/upload.js
import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import verifyToken from "../middlewares/verifyToken.js";

const router = Router();

// Helper tạo storage
function makeStorage(subFolder) {
  const dir = path.resolve(process.cwd(), "public", "uploads", subFolder);
  fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_, __, cb) => cb(null, dir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname);
      const safe = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`;
      cb(null, safe);
    },
  });
}

const imageUpload = multer({ storage: makeStorage("images") });
const videoUpload = multer({ storage: makeStorage("videos") });

// Helper: base URL (PUBLIC_BASE_URL ưu tiên, sau đó tới header / protocol)
function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}`;
}

router.get("/ping", (_, res) => res.json({ ok: true }));

// Upload ảnh: field name = "file"
router.post("/image", verifyToken, imageUpload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file" });
  }

  const baseUrl = getBaseUrl(req);
  const relPath = `/uploads/images/${req.file.filename}`;

  return res.json({
    success: true,
    url: `${baseUrl}${relPath}`, // full URL dùng cho FE
    path: relPath,               // path tương đối nếu muốn lưu
    filename: req.file.filename,
  });
});

// Upload video: field name = "file"
router.post("/video", verifyToken, videoUpload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file" });
  }

  const baseUrl = getBaseUrl(req);
  const relPath = `/uploads/videos/${req.file.filename}`;

  return res.json({
    success: true,
    url: `${baseUrl}${relPath}`,
    path: relPath,
    filename: req.file.filename,
  });
});

export default router;
