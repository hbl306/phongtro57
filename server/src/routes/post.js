const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const verifyToken = require('../middlewares/verifyToken');
const postCtrl = require('../controllers/post');

const router = express.Router();

// Helper tạo storage
function makeStorage(subFolder) {
  const dir = path.join(process.cwd(), 'public', 'uploads', subFolder);
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

const imageUpload = multer({ storage: makeStorage('images') });
const videoUpload = multer({ storage: makeStorage('videos') });

// =========== API Posts ===========
// sanity test
router.get('/ping', (_, res) => res.json({ ok: 1 }));

// List public (có filter query)
router.get('/', postCtrl.getPosts);

// 🔥 LẤY TIN CỦA USER ĐANG ĐĂNG NHẬP
router.get('/mine', verifyToken, postCtrl.getMyPosts);

// Lấy chi tiết 1 bài
router.get('/:id', postCtrl.getPost);

// Tạo bài mới
router.post('/', verifyToken, postCtrl.createPost);

// ✏️ CẬP NHẬT BÀI THEO ID
router.put('/:id', verifyToken, postCtrl.updatePost);

// 💡 GẮN / ĐỔI NHÃN CHO BÀI THEO ID
router.patch('/:id/label', verifyToken, postCtrl.updateLabel);

// ⏳ GIA HẠN THỜI GIAN HIỂN THỊ BÀI THEO ID
router.patch('/:id/extend', verifyToken, postCtrl.extendPost);

// 🔁 ĐĂNG LẠI BÀI THEO ID (GIỮ NGUYÊN ID, TÍNH LẠI PHÍ NHÃN)
router.post('/:id/repost', verifyToken, postCtrl.repostPost);

// ❌ ẨN BÀI THEO ID  (đúng path: /api/posts/:id/hide)
router.patch('/:id/hide', verifyToken, postCtrl.hidePost);

// =========== API Upload ==========
router.post(
  '/upload/image',
  verifyToken,
  imageUpload.single('file'),
  (req, res) => {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file' });
    return res.json({
      success: true,
      url: `/uploads/images/${req.file.filename}`,
    });
  }
);

router.post(
  '/upload/video',
  verifyToken,
  videoUpload.single('file'),
  (req, res) => {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file' });
    return res.json({
      success: true,
      url: `/uploads/videos/${req.file.filename}`,
    });
  }
);

module.exports = router;
