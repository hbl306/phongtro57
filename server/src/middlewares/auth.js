import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Thiếu token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    // Gắn đủ 2 biến để code cũ/mới đều dùng được
    req.userId = decoded.id;
    req.user = {
      id: decoded.id,
      role: decoded.role ?? decoded.is_admin ?? 0,
      phone: decoded.phone,
    };
    next();
  } catch {
    return res.status(403).json({ success: false, message: "Token hết hạn / sai" });
  }
};
