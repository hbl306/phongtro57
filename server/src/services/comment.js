// server/services/comment.js
const db = require("../models");

const Comment = db.Comment;
const Post = db.Post;
const User = db.User;

/** Lấy tất cả comment của 1 bài (kèm info user) */
async function getCommentsByPost(postId) {
  const rows = await Comment.findAll({
    where: { postId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "phone"],
      },
    ],
    order: [["created_at", "ASC"]],
  });

  // Chuẩn hoá data trả về cho FE
  return rows.map((c) => ({
    id: c.id,
    postId: c.postId,
    userId: c.userId,
    userName: c.user?.name || "Người dùng",
    userPhone: c.user?.phone || null,
    content: c.content,
    rating: c.rating,
    parentId: c.parentId,
    createdAt: c.created_at,
  }));
}

/** Tạo comment mới cho 1 bài */
async function createComment(postId, userId, payload) {
  const { content, rating, parentId } = payload || {};

  if (!content || !String(content).trim()) {
    const err = new Error("Nội dung bình luận không được để trống");
    err.status = 400;
    throw err;
  }

  // kiểm tra post tồn tại
  const post = await Post.findByPk(postId);
  if (!post) {
    const err = new Error("Không tìm thấy bài đăng");
    err.status = 404;
    throw err;
  }

  // (tuỳ chọn) kiểm tra parent comment nếu có
  let parent = null;
  if (parentId) {
    parent = await Comment.findByPk(parentId);
    if (!parent) {
      const err = new Error("Comment cha không tồn tại");
      err.status = 400;
      throw err;
    }
  }

  const created = await Comment.create({
    postId,
    userId,
    content: String(content).trim(),
    rating: rating ?? null,
    parentId: parent ? parent.id : null,
  });

  // load lại kèm user
  const full = await Comment.findByPk(created.id, {
    include: [{ model: User, as: "user", attributes: ["id", "name", "phone"] }],
  });

  return {
    id: full.id,
    postId: full.postId,
    userId: full.userId,
    userName: full.user?.name || "Người dùng",
    userPhone: full.user?.phone || null,
    content: full.content,
    rating: full.rating,
    parentId: full.parentId,
    createdAt: full.created_at,
  };
}

/** Xoá comment (chủ comment hoặc admin) */
async function deleteComment(commentId, currentUser) {
  const comment = await Comment.findByPk(commentId);
  if (!comment) {
    const err = new Error("Không tìm thấy bình luận");
    err.status = 404;
    throw err;
  }

  const isOwner = comment.userId === currentUser.id;
  const isAdmin = Number(currentUser.role) === 2; // tuỳ bạn định nghĩa role

  if (!isOwner && !isAdmin) {
    const err = new Error("Bạn không có quyền xoá bình luận này");
    err.status = 403;
    throw err;
  }

  await comment.destroy();
  return { success: true };
}

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
};
