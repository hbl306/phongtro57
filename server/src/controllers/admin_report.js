// src/controllers/admin_report.js
const adminReportService = require("../services/admin_report");

function ensureAdmin(req, res) {
  if (!req.user || Number(req.user.role) !== 2) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return false;
  }
  return true;
}

exports.getReports = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const status = req.query.status === "resolved" ? "resolved" : "new";
    const data = await adminReportService.listReportedPosts(status);

    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

exports.hidePostFromReports = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const postId = req.params.postId;
    const post = await adminReportService.hidePostAndResolveReports(postId);

    return res.json({
      success: true,
      data: { postId: post.id, postStatus: post.status },
      message: "Đã ẩn bài và đánh dấu báo xấu đã xử lý",
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};
