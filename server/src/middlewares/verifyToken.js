// src/middlewares/verifyToken.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "No token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    // giả sử lúc đăng nhập bạn sign như này:
    // jwt.sign({ id: user.id, name: user.name }, ...)
    req.user = {
      id: decoded.id,
      name: decoded.name,
    };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Token hết hạn / sai" });
  }
};
