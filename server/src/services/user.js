// src/services/user.js
const db = require('../models');
const { User, Sequelize } = db;
const { Op } = Sequelize;
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

/**
 * Lấy danh sách user, có filter phone (LIKE)
 */
exports.getUsers = async ({ phone } = {}) => {
  const where = {};
  if (phone) {
    where.phone = { [Op.like]: `%${phone}%` };
  }

  const rows = await User.findAll({
    where,
    order: [['id', 'DESC']], // users không có createdAt
    attributes: ['id', 'name', 'phone', 'role', 'money'],
    limit: 500,
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    role: Number(u.role || 0),
    money: Number(u.money || 0),
  }));
};

/**
 * Tạo user mới (admin)
 */
exports.createUser = async (payload) => {
  const { name = '', phone, password, role = 0, money = 0 } = payload || {};

  if (!phone || !password) {
    const e = new Error('phone and password required');
    e.status = 400;
    throw e;
  }

  const existing = await User.findOne({ where: { phone } });
  if (existing) {
    const e = new Error('Phone already exists');
    e.status = 400;
    throw e;
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    phone,
    password: hash,
    role: Number(role),
    money: Number(money),
  });

  return user;
};

/**
 * Cập nhật user (admin)
 */
exports.updateUser = async (id, payload) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  const { name, phone, password, role, money } = payload || {};

  // Kiểm tra trùng phone
  if (phone && phone !== user.phone) {
    const dup = await User.findOne({ where: { phone } });
    if (dup && Number(dup.id) !== Number(id)) {
      const e = new Error('Phone already exists');
      e.status = 400;
      throw e;
    }
    user.phone = phone;
  }

  if (typeof name !== 'undefined') user.name = name;
  if (typeof role !== 'undefined') user.role = Number(role);
  if (typeof money !== 'undefined') user.money = Number(money);

  // Nếu có password mới → hash lại
  if (password) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    user.password = hash;
  }

  await user.save();
  return user;
};

/**
 * Xóa user
 */
exports.deleteUser = async (id) => {
  const deleted = await User.destroy({ where: { id } });
  return deleted > 0;
};
