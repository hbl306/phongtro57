// server/src/controllers/auth.js
import * as authService from "../services/auth.js";

/**
 * POST /api/auth/register
 * body: { name, phone, password, role } // role: 0 (người thuê), 1 (người cho thuê)
 */
export const register = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Chỉ chấp nhận 0 hoặc 1 từ client. Không cho tạo admin ở đây.
    const safeRole = Number(role) === 1 ? 1 : 0;

    const response = await authService.registerService({
      name,
      phone,
      password,
      role: safeRole,
    });

    if (response.err) {
      // 409 khi trùng SĐT, các case khác 400
      const code = response.message?.includes("đăng ký") ? 409 : 400;
      return res.status(code).json({ message: response.message });
    }

    // response.user sẽ có { id, name, phone, role, money }, kèm token
    return res.status(201).json(response);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/auth/login
 * body: { phone, password }
 */
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    }

    const response = await authService.loginService({ phone, password });

    if (response.err) {
      return res.status(401).json({ message: response.message });
    }

    // response.user sẽ có { id, name, phone, role, money }, kèm token
    return res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
 *  PATCH /api/auth/profile
 *  Cập nhật thông tin cá nhân (name)
 * =======================================================*/
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Không xác định user." });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tên liên hệ không được để trống.",
      });
    }

    const result = await authService.updateProfileService(userId, {
      name: name.trim(),
    });

    if (result.err) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      data: result.user,
      message: "Cập nhật thông tin thành công.",
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* =========================================================
 *  POST /api/auth/change-password
 *  body: { oldPassword, newPassword }
 * =======================================================*/
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Không xác định user." });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đủ thông tin.",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
    }

    const result = await authService.changePasswordService(
      userId,
      oldPassword,
      newPassword
    );

    if (result.err) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.message || "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* =========================================================
 *  POST /api/auth/change-role
 *  body: { role } // 0 hoặc 1
 * =======================================================*/
export const changeRole = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Không xác định user." });
    }

    const { role } = req.body;
    const newRole = Number(role) === 1 ? 1 : 0;

    const result = await authService.changeRoleService(userId, newRole);

    if (result.err) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.message || "Đổi vai trò thành công.",
    });
  } catch (error) {
    console.error("changeRole error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
