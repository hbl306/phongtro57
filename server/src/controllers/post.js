const postService = require('../services/post');

// Tạo bài đăng mới + trừ tiền nhãn
exports.createPost = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const result = await postService.createPost(req.body, userId);

    const post = result?.post || result;
    const charged = result?.charged ?? 0;
    const balance = result?.balance;

    return res.status(201).json({
      success: true,
      data: { id: post.id },
      charged,
      balance,
      message: 'Tạo bài thành công',
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({
        success: false,
        code: err.code,
        message: 'Số dư tài khoản không đủ',
        needed: err.needed,
        balance: err.balance,
      });
    }

    console.log('createPost error >>>', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};

// Lấy list bài public (có filter)
exports.getPosts = async (req, res) => {
  try {
    const posts = await postService.getPosts(req.query);
    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy chi tiết 1 bài
exports.getPost = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    return res.json({ success: true, data: post });
  } catch (err) {
    const status = err.status || 404;
    return res.status(status).json({ success: false, message: err.message });
  }
};

/** 🔥 LẤY DANH SÁCH TIN CỦA USER ĐANG ĐĂNG NHẬP */
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const posts = await postService.getPostsByUser(userId);

    return res.json({
      success: true,
      data: posts,
    });
  } catch (err) {
    console.log('getMyPosts error >>>', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** ✏️ CẬP NHẬT BÀI ĐĂNG (KHÔNG TRỪ TIỀN, GIỮ NGUYÊN NHÃN) */
exports.updatePost = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const result = await postService.updatePost(
      req.params.id,
      req.body,
      userId
    );
    const post = result?.post || result;

    return res.json({
      success: true,
      data: { id: post.id },
      message: 'Cập nhật bài thành công',
    });
  } catch (err) {
    console.log('updatePost error >>>', err);

    const status = err.status || 500;
    const message =
      err.message ||
      (status === 403
        ? 'Bạn không có quyền sửa bài đăng này'
        : 'Internal server error');

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

/** 💡 GẮN / ĐỔI NHÃN CHO BÀI ĐĂNG + TRỪ TIỀN */
exports.updateLabel = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const postId = req.params.id;
    const { labelCode } = req.body;

    const result = await postService.updateLabel(postId, labelCode, userId);
    const post = result?.post || result;
    const charged = result?.charged ?? 0;
    const balance = result?.balance;

    return res.json({
      success: true,
      data: { id: post.id, labelCode: post.labelCode },
      charged,
      balance,
      message: 'Cập nhật nhãn thành công',
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({
        success: false,
        code: err.code,
        message: 'Số dư tài khoản không đủ',
        needed: err.needed,
        balance: err.balance,
      });
    }

    console.log('updateLabel error >>>', err);
    const status = err.status || 500;

    return res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** ⏱️ GIA HẠN BÀI ĐĂNG */
exports.extendPost = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const postId = req.params.id;
    const { days } = req.body;

    const result = await postService.extendPost(postId, days, userId);
    const post = result?.post || result;
    const charged = result?.charged ?? 0;
    const balance = result?.balance;

    return res.json({
      success: true,
      data: {
        id: post.id,
        star: post.star,
        status: post.status,
        createdAt: post.createdAt,
      },
      charged,
      balance,
      message: 'Gia hạn bài đăng thành công',
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({
        success: false,
        code: err.code,
        message: 'Số dư tài khoản không đủ',
        needed: err.needed,
        balance: err.balance,
      });
    }

    console.log('extendPost error >>>', err);
    const status = err.status || 500;

    return res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** 🔁 ĐĂNG LẠI BÀI ĐĂNG */
exports.repostPost = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const postId = req.params.id;
    const result = await postService.repostPost(postId, req.body, userId);

    const post = result?.post || result;
    const charged = result?.charged ?? 0;
    const balance = result?.balance;

    return res.json({
      success: true,
      data: {
        id: post.id,
        status: post.status,
        star: post.star,
        createdAt: post.createdAt,
        labelCode: post.labelCode,
      },
      charged,
      balance,
      message: 'Đăng lại bài thành công',
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({
        success: false,
        code: err.code,
        message: 'Số dư tài khoản không đủ',
        needed: err.needed,
        balance: err.balance,
      });
    }

    console.log('repostPost error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** 🙈 ẨN BÀI ĐĂNG (chỉ chủ bài) */
exports.hidePost = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const postId = req.params.id;
    const post = await postService.hidePost(postId, userId);

    return res.json({
      success: true,
      data: { id: post.id, status: post.status },
      message: 'Ẩn tin thành công',
    });
  } catch (err) {
    console.log('hidePost error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** 🛏️ ĐẶT PHÒNG (BOOKING) CHO MỘT BÀI ĐĂNG */
exports.bookPost = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định userId' });
    }

    const postId = req.params.id;
    const result = await postService.bookPost(postId, userId);

    const booking = result?.booking;
    const post = result?.post;
    const charged = result?.charged ?? 0;
    const balance = result?.balance;

    return res.status(201).json({
      success: true,
      data: {
        bookingId: booking.id,
        postId: post.id,
        postStatus: post.status,
      },
      charged,
      balance,
      message: 'Đặt phòng thành công',
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({
        success: false,
        code: err.code,
        message: 'Số dư tài khoản không đủ',
        needed: err.needed,
        balance: err.balance,
      });
    }

    console.log('bookPost error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/* ========== PHẦN DÀNH CHO ADMIN (dùng qua /api/admin) ========== */

exports.getPendingPosts = async (req, res) => {
  try {
    const query = { ...req.query, status: 'pending' };
    const posts = await postService.getPosts(query);

    return res.json({ success: true, data: posts });
  } catch (err) {
    console.log('getPendingPosts error >>>', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await postService.approvePostByAdmin(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng',
      });
    }

    return res.json({
      success: true,
      data: { id: post.id, status: post.status, star: post.star },
      message: 'Duyệt bài thành công',
    });
  } catch (err) {
    console.log('approvePost error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

exports.deletePostByAdmin = async (req, res) => {
  try {
    const postId = req.params.id;

    const result = await postService.deletePostByAdmin(postId);
    const ok = result?.success ?? false;

    if (!ok) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng',
      });
    }

    return res.json({
      success: true,
      message: 'Xoá bài đăng thành công',
    });
  } catch (err) {
    console.log('deletePostByAdmin error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
exports.createReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Bạn chưa đăng nhập" });
    }

    const postId = req.params.id;
    const report = await postService.createReportForPost(postId, req.body, userId);

    return res.status(201).json({
      success: true,
      data: { id: report.id },
      message: "Gửi phản ánh thành công",
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};