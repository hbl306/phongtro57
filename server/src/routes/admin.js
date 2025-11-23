// src/routes/admin.js
const express = require('express');
const verifyToken = require('../middlewares/verifyToken');
const postCtrl = require('../controllers/post');

const router = express.Router();

/**
 * Lấy danh sách bài đăng CHỜ DUYỆT (status = "pending")
 * GET /api/admin/posts
 */
router.get('/posts', verifyToken, postCtrl.getPendingPosts);

/**
 * Duyệt bài đăng
 * PATCH /api/admin/posts/:id/approve
 *  - set status = "approved"
 *  - set star = 3
 */
router.patch('/posts/:id/approve', verifyToken, postCtrl.approvePost);

/**
 * Từ chối bài: xoá luôn khỏi DB
 * DELETE /api/admin/posts/:id
 */
router.delete('/posts/:id', verifyToken, postCtrl.deletePostByAdmin);

module.exports = router;
