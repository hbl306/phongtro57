// src/middlewares/verifyToken.js
const jwt = require('jsonwebtoken');
const db = require('../models');        // 👈 lấy models
const { User } = db;

module.exports = async function verifyToken(req, res, next) {
  try {
    const authHeader =
      req.headers.authorization || req.headers.Authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ success: false, message: 'No token' });
    }

    const token = authHeader.slice(7); // bỏ "Bearer "

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    } catch (e) {
      return res
        .status(401)
        .json({ success: false, message: 'Token hết hạn / sai' });
    }

    // Tìm user thực tế trong DB để lấy role hiện tại
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'phone', 'role', 'money'],
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Gán lại req.user với thông tin mới nhất
    req.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      money: user.money,
    };

    next();
  } catch (e) {
    console.error('verifyToken error >>>', e);
    return res
      .status(500)
      .json({ success: false, message: 'Lỗi xác thực người dùng' });
  }
};
