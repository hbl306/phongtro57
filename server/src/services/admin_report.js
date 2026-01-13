// src/services/admin_report.js
const db = require("../models");
const { Report, Post } = db;

exports.listReportedPosts = async (status = "new") => {
  const s = status === "resolved" ? "resolved" : "new";

  const rows = await Report.findAll({
    where: { status: s },
    include: [
      {
        model: Post,
        as: "post",
        attributes: ["id", "title", "address", "price", "status", "createdAt"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // gom theo postId để “mỗi bài đăng bị báo cáo” chỉ hiện 1 card
  const map = new Map();

  for (const r of rows) {
    const post = r.post;
    if (!post) continue;

    const postId = r.postId;

    if (!map.has(postId)) {
      map.set(postId, {
        postId,
        post: {
          id: post.id,
          title: post.title,
          address: post.address,
          price: post.price,
          status: post.status,
          createdAt: post.createdAt,
        },
        reports: [],
      });
    }

    map.get(postId).reports.push({
      id: r.id,
      reason: r.reason,
      description: r.description,
      reporterName: r.reporterName,
      reporterPhone: r.reporterPhone,
      reporterUserId: r.reporterUserId,
      status: r.status,
      createdAt: r.createdAt,
    });
  }

  return Array.from(map.values());
};

exports.hidePostAndResolveReports = async (postId) => {
  const t = await db.sequelize.transaction();
  try {
    const post = await Post.findByPk(postId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!post) {
      const err = new Error("Không tìm thấy bài đăng");
      err.status = 404;
      throw err;
    }

    post.status = "hidden";
    await post.save({ transaction: t });

    await Report.update(
      { status: "resolved" },
      { where: { postId }, transaction: t }
    );

    await t.commit();
    return post;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
