// src/routes/admin.js
const express = require('express');
const verifyToken = require('../middlewares/verifyToken');
const postCtrl = require('../controllers/post');
const bookingController = require('../controllers/booking');
const adminUserCtrl = require('../controllers/user'); 
const adminCtrl = require('../controllers/admin');

const router = express.Router();
/**
 * Dashboard tổng quan
 * GET /api/admin/dashboard
 */
router.get('/dashboard', verifyToken, adminCtrl.getDashboardStats);

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

/* ===== bookings (you already had) ===== */
router.get('/bookings', verifyToken, bookingController.adminGetAllBookings);

router.post(
  '/bookings/:id/send-deposit',
  verifyToken,
  bookingController.adminSendDeposit
);

/* ===== user management =====
  GET  /api/admin/users?phone=...
  POST /api/admin/users
  PUT  /api/admin/users/:id
  DELETE /api/admin/users/:id
======================================*/
router.get('/users', verifyToken, adminUserCtrl.getUsers);
router.post('/users', verifyToken, adminUserCtrl.createUser);
router.put('/users/:id', verifyToken, adminUserCtrl.updateUser);
router.delete('/users/:id', verifyToken, adminUserCtrl.deleteUser);

module.exports = router;
