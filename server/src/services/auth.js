// server/src/services/auth.js
import db from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const JWT_EXPIRES_IN = "7d";

const exposeUser = (u) => ({
  id: u.id,
  name: u.name,
  phone: u.phone,
  role: Number(u.role ?? 0),
  money: Number(u.money ?? 0),
});

// ---------- ĐĂNG KÝ ----------
export const registerService = async ({ name, phone, password, role }) => {
  // check trùng sđt
  const existed = await db.User.findOne({ where: { phone } });
  if (existed) {
    return { err: 1, message: "Số điện thoại đã được đăng ký" };
  }

  // hash mật khẩu
  const hashed = await bcrypt.hash(password, 10);

  // role hợp lệ: 0 (người thuê), 1 (người cho thuê)
  // KHÔNG cho phép tạo role 2 (admin) từ client
  const safeRole = Number(role) === 1 ? 1 : 0;

  // tạo user
  const user = await db.User.create({
    name,
    phone,
    password: hashed,
    role: safeRole,
    money: 0,
  });

  // tạo token
  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: safeRole },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    err: 0,
    message: "Đăng ký thành công",
    user: exposeUser(user),
    token,
  };
};

// ---------- ĐĂNG NHẬP ----------
export const loginService = async ({ phone, password }) => {
  const user = await db.User.findOne({ where: { phone } });
  if (!user) {
    return { err: 1, message: "Số điện thoại hoặc mật khẩu không đúng" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { err: 1, message: "Số điện thoại hoặc mật khẩu không đúng" };
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: Number(user.role ?? 0) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    err: 0,
    message: "Đăng nhập thành công",
    user: exposeUser(user),
    token,
  };
};

// ---------- CẬP NHẬT THÔNG TIN CÁ NHÂN ----------
export const updateProfileService = async (userId, { name }) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    return { err: 1, message: "Không tìm thấy người dùng." };
  }

  user.name = name;
  await user.save();

  return {
    err: 0,
    user: exposeUser(user),
  };
};

// ---------- ĐỔI MẬT KHẨU ----------
export const changePasswordService = async (
  userId,
  oldPassword,
  newPassword
) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    return { err: 1, message: "Không tìm thấy người dùng." };
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password || "");
  if (!isMatch) {
    return { err: 1, message: "Mật khẩu cũ không đúng." };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  return {
    err: 0,
    message: "Đổi mật khẩu thành công.",
  };
};

// ---------- ĐỔI VAI TRÒ (0: Người thuê, 1: Người cho thuê) ----------
export const changeRoleService = async (userId, role) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    return { err: 1, message: "Không tìm thấy người dùng." };
  }

  // Không cho đổi role admin từ UI
  if (Number(user.role) === 2) {
    return {
      err: 1,
      message: "Không thể đổi vai trò của tài khoản quản trị viên.",
    };
  }

  const safeRole = Number(role) === 1 ? 1 : 0;
  user.role = safeRole;
  await user.save();

  return {
    err: 0,
    message: "Đổi vai trò thành công.",
    user: exposeUser(user),
  };
};
