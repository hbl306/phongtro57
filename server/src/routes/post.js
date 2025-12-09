// src/routes/post.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const verifyToken = require("../middlewares/verifyToken");
const postCtrl = require("../controllers/post");

const router = express.Router();

// Helper tạo storage cho multer
function makeStorage(subFolder) {
  const dir = path.join(process.cwd(), "public", "uploads", subFolder);
  fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_, __, cb) => cb(null, dir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`;
      cb(null, name);
    },
  });
}

const imageUpload = multer({ storage: makeStorage("images") });
const videoUpload = multer({ storage: makeStorage("videos") });

// Helper: lấy base URL đúng cho cả localhost & devtunnel
function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}`;
}

// =========== API Posts ===========

// sanity test
router.get("/ping", (_, res) => res.json({ ok: 1 }));

// List public (có filter query)
router.get("/", postCtrl.getPosts);

// 🔥 LẤY TIN CỦA USER ĐANG ĐĂNG NHẬP
router.get("/mine", verifyToken, postCtrl.getMyPosts);

// Lấy chi tiết 1 bài
router.get("/:id", postCtrl.getPost);

// Tạo bài mới
router.post("/", verifyToken, postCtrl.createPost);

// ✏️ CẬP NHẬT BÀI THEO ID
router.put("/:id", verifyToken, postCtrl.updatePost);

// 💡 GẮN / ĐỔI NHÃN CHO BÀI THEO ID
router.patch("/:id/label", verifyToken, postCtrl.updateLabel);

// ⏳ GIA HẠN THỜI GIAN HIỂN THỊ BÀI THEO ID
router.patch("/:id/extend", verifyToken, postCtrl.extendPost);

// 🔁 ĐĂNG LẠI BÀI THEO ID
router.post("/:id/repost", verifyToken, postCtrl.repostPost);

// 🛏️ ĐẶT PHÒNG (BOOKING) CHO BÀI THEO ID
router.post("/:id/booking", verifyToken, postCtrl.bookPost);

// ❌ ẨN BÀI THEO ID  (đúng path: /api/posts/:id/hide)
router.patch("/:id/hide", verifyToken, postCtrl.hidePost);

// =========== API Upload (nếu FE vẫn dùng chung router này) ==========

// Upload ảnh: field name = "file"
router.post(
  "/upload/image",
  verifyToken,
  imageUpload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file" });
    }

    const baseUrl = getBaseUrl(req);
    const relPath = `/uploads/images/${req.file.filename}`;

    return res.json({
      success: true,
      url: `${baseUrl}${relPath}`, // full URL truy cập từ máy nào cũng được
      path: relPath,               // nếu FE muốn tự ghép với API_BASE
      filename: req.file.filename,
    });
  }
);

// Upload video: field name = "file"
router.post(
  "/upload/video",
  verifyToken,
  videoUpload.single("file"),
  (req, res) => {
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
  }
);

module.exports = router;
