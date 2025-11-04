// server/src/services/auth.js
import db from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const JWT_EXPIRES_IN = "7d";

// ---------- ĐĂNG KÝ ----------
export const registerService = async ({ name, phone, password }) => {
  // check trùng sđt
  const existed = await db.User.findOne({ where: { phone } });
  if (existed) {
    return {
      err: 1,
      message: "Số điện thoại đã được đăng ký",
    };
  }

  // hash mật khẩu
  const hashed = await bcrypt.hash(password, 10);

  // tạo user
  const user = await db.User.create({
    name,
    phone,
    password: hashed,
    is_admin: 0,
  });

  // tạo token luôn cũng được
  const token = jwt.sign(
    { id: user.id, phone: user.phone, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    err: 0,
    message: "Đăng ký thành công",
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      is_admin: user.is_admin,
    },
    token,
  };
};

// ---------- ĐĂNG NHẬP ----------
export const loginService = async ({ phone, password }) => {
  // 1. tìm user theo phone
  const user = await db.User.findOne({ where: { phone } });
  if (!user) {
    return { err: 1, message: "Số điện thoại hoặc mật khẩu không đúng" };
  }

  // 2. mật khẩu trong DB phải là dạng bcrypt
  //    nếu bạn vừa đăng ký qua API thì nó sẽ giống như: $2b$10$.....
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return { err: 1, message: "Số điện thoại hoặc mật khẩu không đúng" };
  }

  // 3. tạo token
  const token = jwt.sign(
    { id: user.id, phone: user.phone, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    err: 0,
    message: "Đăng nhập thành công",
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      is_admin: user.is_admin,
    },
    token,
  };
};