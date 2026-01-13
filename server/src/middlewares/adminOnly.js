export default function requireAdmin(req, res, next) {
  if (Number(req.user?.role) !== 2) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  next();
}
