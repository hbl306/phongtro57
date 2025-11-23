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
      const code = response.message?.includes("đăng ký")
        ? 409
        : 400;
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
