// src/controllers/admin.js
const userService = require('../services/user');
const adminStatsService = require('../services/admin');

/** Lấy danh sách user (kèm filter theo phone) */
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers(req.query);
    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.log('admin getUsers error >>>', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** Tạo user mới */
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        money: user.money,
      },
      message: 'Tạo tài khoản thành công',
    });
  } catch (err) {
    console.log('admin createUser error >>>', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** Cập nhật user */
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản',
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        money: user.money,
      },
      message: 'Cập nhật tài khoản thành công',
    });
  } catch (err) {
    console.log('admin updateUser error >>>', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** Xoá user */
exports.deleteUser = async (req, res) => {
  try {
    const ok = await userService.deleteUser(req.params.id);
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản',
      });
    }

    return res.json({
      success: true,
      message: 'Xoá tài khoản thành công',
    });
  } catch (err) {
    console.log('admin deleteUser error >>>', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** 🔥 Dashboard tổng quan cho admin */
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await adminStatsService.getDashboardStats();
    return res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.log('getDashboardStats error >>>', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
