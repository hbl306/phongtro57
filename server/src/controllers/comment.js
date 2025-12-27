// server/controllers/comment.js
const db = require("../models");

const Comment = db.Comment;    // models/comment.js
const User = db.User;          // models/user.js

/** Lấy danh sách comment của 1 bài */
exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const rows = await Comment.findAll({
      where: { postId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "phone"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const data = rows.map((c) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      userName: c.user?.name || "Người dùng",
      content: c.content,
      createdAt: c.created_at,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getCommentsByPost error >>>", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/** Tạo comment mới – chỉ cho người thuê (role = 0) */
exports.createComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Bạn chưa đăng nhập" });
    }

    // ❗ chỉ cho người thuê (role = 0) được bình luận
    if (role !== 0) {
      return res.status(403).json({
        success: false,
        message: "Chỉ tài khoản người thuê mới được bình luận.",
      });
    }

    const postId = req.params.id;
    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nội dung bình luận không được để trống.",
      });
    }

    const c = await Comment.create({
      postId,
      userId,
      content: content.trim(),
    });

    const user = await User.findByPk(userId, {
      attributes: ["name"],
    });

    return res.status(201).json({
      success: true,
      data: {
        id: c.id,
        postId,
        userId,
        userName: user?.name || "Người dùng",
        content: c.content,
        createdAt: c.created_at,
      },
    });
  } catch (err) {
    console.error("createComment error >>>", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/** Xoá comment – cho chính chủ comment (hoặc sau bạn thêm admin) */
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Bạn chưa đăng nhập" });
    }

    const { commentId } = req.params;
    const c = await Comment.findByPk(commentId);

    if (!c) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bình luận" });
    }

    if (c.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xoá bình luận này.",
      });
    }

    await c.destroy();

    return res.json({ success: true, message: "Đã xoá bình luận" });
  } catch (err) {
    console.error("deleteComment error >>>", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
