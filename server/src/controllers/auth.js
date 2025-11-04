// server/src/controllers/auth.js
import * as authService from "../services/auth.js";

export const register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const response = await authService.registerService(req.body);
    if (response.err === 1) {
      return res.status(409).json({ message: response.message });
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { phone, password } = req.body;

  try {
    if (!phone || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    }

    const response = await authService.loginService({ phone, password });

    if (response.err === 1) {
      return res.status(401).json({ message: response.message });
    }

    return res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};