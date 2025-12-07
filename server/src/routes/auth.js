// server/src/routes/auth.js
import express from "express";
import * as authController from "../controllers/auth.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Đăng ký / Đăng nhập
router.post("/register", authController.register);
router.post("/login", authController.login);

// Cập nhật thông tin cá nhân
router.patch("/profile", verifyToken, authController.updateProfile);

// Đổi mật khẩu
router.post(
  "/change-password",
  verifyToken,
  authController.changePassword
);

// Đổi vai trò (0 / 1) – FE cập nhật xong thì logout
router.post("/change-role", verifyToken, authController.changeRole);

export default router;
