// src/services/booking.js
const db = require('../models');
const { Booking, Post, User, Image, Video, WalletHistory } = db;
const { Op } = require('sequelize');

/* ---------- helper map post ---------- */
function mapPost(p) {
  if (!p) return null;
  const imgs = Array.isArray(p.images) ? p.images : [];
  const vids = Array.isArray(p.videos) ? p.videos : [];
  const primary =
    imgs.find((i) => (i.isPrimary ?? i.is_primary) === 1) || imgs[0];

  return {
    id: p.id,
    userId: p.userId,
    title: p.title,
    description: p.description,
    price: p.price,
    area: p.area,
    province: p.province,
    district: p.district,
    ward: p.ward,
    street: p.street,
    address: p.address,
    categoryCode: p.categoryCode,
    labelCode: p.labelCode || null,
    star: p.star || 0,
    status: p.status || 'pending',
    contact_name: p.contact_name || '',
    contact_phone: p.contact_phone || '',
    createdAt: p.createdAt,
    coverImage: primary ? primary.url : null,
    images: imgs.map((i) => ({
      url: i.url,
      isPrimary: i.isPrimary ?? i.is_primary,
      sortOrder: i.sortOrder ?? i.sort_order,
    })),
    videos: vids.map((v) => ({ url: v.url })),
  };
}

/* ---------- helper ghi lịch sử ví ---------- */
async function logWalletHistory({
  t,
  userId,
  action,
  amountIn = 0,
  amountOut = 0,
  balanceBefore,
  balanceAfter,
  refType = null,
  note = null,
}) {
  try {
    if (!WalletHistory) return;

    const payload = {
      userId,
      action,
      amountIn,
      amountOut,
      balanceBefore,
      balanceAfter,
      refType,
      note,
    };

    const options = t ? { transaction: t } : {};
    await WalletHistory.create(payload, options);
  } catch (e) {
    console.error('logWalletHistory error:', e.message);
  }
}

/* ============================================================
 *  autoExpirePendingBookingsInternal
 *  - Tự động xử lý các booking:
 *      + status = 'pending'
 *      + expiresAt < NOW()
 *  - Với mỗi booking:
 *      + booking.status = 'expired'
 *      + post.status = 'approved' (nếu đang 'booking')
 *      + Hoàn tiền cọc cho người THUÊ (user.money += deposit)
 *      + Ghi wallet_history action = 'REFUND'
 * ==========================================================*/
async function autoExpirePendingBookingsInternal() {
  const t = await db.sequelize.transaction();

  try {
    const now = new Date();

    const pendingExpired = await Booking.findAll({
      where: {
        status: 'pending',
        expiresAt: {
          [Op.lt]: now,
        },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!pendingExpired.length) {
      await t.commit();
      return { total: 0 };
    }

    for (const booking of pendingExpired) {
      const userId = booking.userId;
      const postId = booking.postId;

      const user = await User.findByPk(userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const post = await Post.findByPk(postId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      // Nếu thiếu user hoặc post thì bỏ qua (không crash cả batch)
      if (!user || !post) continue;

      const deposit = Number(booking.depositAmount || 0);
      const balanceBefore = Number(user.money || 0);
      const balanceAfter = balanceBefore + deposit;

      // Hoàn tiền lại cho người thuê
      user.money = balanceAfter;
      await user.save({ transaction: t });

      // Cập nhật booking -> expired
      booking.status = 'expired';
      await booking.save({ transaction: t });

      // Tin đang "booking" thì thả về "approved"
      if (post.status === 'booking') {
        post.status = 'approved';
        await post.save({ transaction: t });
      }

      // Ghi lịch sử ví
      if (deposit > 0) {
        await logWalletHistory({
          t,
          userId,
          action: 'REFUND',
          amountIn: deposit,
          amountOut: 0,
          balanceBefore,
          balanceAfter,
          refType: 'BOOKING',
          note: `Hoàn cọc tự động do booking #${booking.id} hết hạn (tin #${post.id})`,
        });
      }
    }

    await t.commit();
    return { total: pendingExpired.length };
  } catch (err) {
    await t.rollback();
    console.error('autoExpirePendingBookingsInternal error >>>', err);
    throw err;
  }
}

/* ============================================================
 *  getBookingsOfUser: list booking của NGƯỜI THUÊ
 *  - Mỗi lần gọi sẽ auto-expire các booking quá hạn trước
 * ==========================================================*/
exports.getBookingsOfUser = async (userId) => {
  // Dọn các booking pending đã quá hạn trước khi trả list
  await autoExpirePendingBookingsInternal();

  const rows = await Booking.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Post,
        as: 'post',
        required: true,
        include: [
          {
            model: Image,
            as: 'images',
            attributes: ['id', 'url', 'isPrimary', 'sortOrder'],
            required: false,
          },
          {
            model: Video,
            as: 'videos',
            attributes: ['id', 'url'],
            required: false,
          },
        ],
      },
    ],
  });

  return rows.map((b) => ({
    id: b.id,
    postId: b.postId,
    userId: b.userId,
    depositAmount: b.depositAmount,
    expiresAt: b.expiresAt,
    confirmedAt: b.confirmedAt,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    post: mapPost(b.post),
  }));
};

/* ============================================================
 *  getBookingsOfLandlord: list booking của NGƯỜI CHO THUÊ
 *  - Mỗi lần gọi sẽ auto-expire các booking quá hạn trước
 * ==========================================================*/
exports.getBookingsOfLandlord = async (landlordId) => {
  // Dọn các booking pending đã quá hạn trước khi trả list
  await autoExpirePendingBookingsInternal();

  const rows = await Booking.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Post,
        as: 'post',
        required: true,
        where: { userId: landlordId }, // chỉ các tin của landlord
        include: [
          {
            model: Image,
            as: 'images',
            attributes: ['id', 'url', 'isPrimary', 'sortOrder'],
            required: false,
          },
          {
            model: Video,
            as: 'videos',
            attributes: ['id', 'url'],
            required: false,
          },
        ],
      },
      {
        model: User,
        as: 'user', // người thuê
        attributes: ['id', 'name', 'phone', 'role', 'money'],
        required: true,
      },
    ],
  });

  return rows.map((b) => ({
    id: b.id,
    postId: b.postId,
    tenantId: b.userId,
    depositAmount: b.depositAmount,
    expiresAt: b.expiresAt,
    confirmedAt: b.confirmedAt,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    tenant: b.user
      ? {
          id: b.user.id,
          name: b.user.name,
          phone: b.user.phone,
        }
      : null,
    post: mapPost(b.post),
  }));
};

/* ============================================================
 *  confirmBooking: người THUÊ xác nhận thuê phòng
 *  - Chỉ cho booking.status = 'pending'
 *  - Nếu chưa hết hạn: post.status = 'booked', booking.status = 'confirmed'
 *  - Nếu đã hết hạn: post.status = 'approved', booking.status = 'expired'
 *    + Hoàn lại tiền cọc (REFUND)
 * ==========================================================*/
exports.confirmBooking = async (bookingId, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const booking = await Booking.findOne({
      where: { id: bookingId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!booking) {
      const err = new Error('Không tìm thấy đặt phòng');
      err.status = 404;
      throw err;
    }

    if (booking.status !== 'pending') {
      const err = new Error('Đặt phòng đã được xử lý, không thể xác nhận');
      err.status = 400;
      throw err;
    }

    const now = new Date();
    const isExpired =
      booking.expiresAt && booking.expiresAt.getTime() < now.getTime();

    const post = await Post.findByPk(booking.postId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!post) {
      const err = new Error('Không tìm thấy tin phòng');
      err.status = 404;
      throw err;
    }

    // Nếu đã hết hạn => coi như expired + hoàn cọc
    if (isExpired) {
      const user = await User.findByPk(userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!user) {
        const err = new Error('Không tìm thấy người dùng');
        err.status = 404;
        throw err;
      }

      const deposit = Number(booking.depositAmount || 0);
      const balanceBefore = Number(user.money || 0);
      const balanceAfter = balanceBefore + deposit;

      user.money = balanceAfter;
      await user.save({ transaction: t });

      booking.status = 'expired';
      await booking.save({ transaction: t });

      if (post.status === 'booking') {
        post.status = 'approved';
        await post.save({ transaction: t });
      }

      if (deposit > 0) {
        await logWalletHistory({
          t,
          userId,
          action: 'REFUND',
          amountIn: deposit,
          amountOut: 0,
          balanceBefore,
          balanceAfter,
          refType: 'BOOKING',
          note: `Hoàn cọc do booking #${booking.id} hết hạn (tin #${post.id})`,
        });
      }

      await t.commit();
      return {
        expired: true,
        booking,
        post,
        refundedAmount: deposit,
        balance: balanceAfter,
      };
    }

    // Trường hợp xác nhận bình thường
    post.status = 'booked';
    await post.save({ transaction: t });

    booking.status = 'confirmed';
    booking.confirmedAt = now;
    await booking.save({ transaction: t });

    await t.commit();
    return {
      expired: false,
      booking,
      post,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/* ============================================================
 *  cancelBooking: người THUÊ hủy đặt phòng
 *  - Áp dụng cho booking.status = 'pending'
 *  - Nếu now <= expiresAt: booking.status = 'canceled'
 *  - Nếu now  > expiresAt: booking.status = 'expired'
 *  - Cả 2 TH đều:
 *      + post.status = 'approved'
 *      + Hoàn tiền cọc (REFUND)
 * ==========================================================*/
exports.cancelBooking = async (bookingId, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const booking = await Booking.findOne({
      where: { id: bookingId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!booking) {
      const err = new Error('Không tìm thấy đặt phòng');
      err.status = 404;
      throw err;
    }

    if (booking.status !== 'pending') {
      const err = new Error('Đặt phòng đã được xử lý, không thể hủy');
      err.status = 400;
      throw err;
    }

    const now = new Date();
    const isExpired =
      booking.expiresAt && booking.expiresAt.getTime() < now.getTime();
    const newStatus = isExpired ? 'expired' : 'canceled';

    const user = await User.findByPk(userId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!user) {
      const err = new Error('Không tìm thấy người dùng');
      err.status = 404;
      throw err;
    }

    const post = await Post.findByPk(booking.postId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!post) {
      const err = new Error('Không tìm thấy tin phòng');
      err.status = 404;
      throw err;
    }

    const deposit = Number(booking.depositAmount || 0);
    const balanceBefore = Number(user.money || 0);
    const balanceAfter = balanceBefore + deposit;

    user.money = balanceAfter;
    await user.save({ transaction: t });

    booking.status = newStatus;
    await booking.save({ transaction: t });

    if (post.status === 'booking') {
      post.status = 'approved';
      await post.save({ transaction: t });
    }

    if (deposit > 0) {
      await logWalletHistory({
        t,
        userId,
        action: 'REFUND',
        amountIn: deposit,
        amountOut: 0,
        balanceBefore,
        balanceAfter,
        refType: 'BOOKING',
        note: `Hoàn cọc do ${
          isExpired ? 'hết hạn' : 'hủy đặt phòng'
        } (booking #${booking.id}, tin #${post.id})`,
      });
    }

    await t.commit();
    return {
      expired: isExpired,
      booking,
      post,
      refundedAmount: deposit,
      balance: balanceAfter,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
/* ============================================================
 *  adminSendDepositToLandlord
 *  - Chỉ áp dụng cho booking.status = 'confirmed'
 *  - Logic:
 *      + Lấy booking, post, landlord (post.userId)
 *      + landlord.money += depositAmount
 *      + booking.status = 'paid'
 *      + Ghi wallet_history: action = 'RECEIVE_DEPOSIT'
 * ==========================================================*/
exports.adminSendDepositToLandlord = async (bookingId) => {
  const t = await db.sequelize.transaction();

  try {
    const booking = await Booking.findByPk(bookingId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!booking) {
      const err = new Error('Không tìm thấy đặt phòng');
      err.status = 404;
      throw err;
    }

    if (booking.status !== 'confirmed') {
      const err = new Error('Chỉ gửi tiền cho các đặt phòng đã được xác nhận');
      err.status = 400;
      throw err;
    }

    const post = await Post.findByPk(booking.postId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!post) {
      const err = new Error('Không tìm thấy tin phòng');
      err.status = 404;
      throw err;
    }

    const landlord = await User.findByPk(post.userId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!landlord) {
      const err = new Error('Không tìm thấy chủ bài đăng');
      err.status = 404;
      throw err;
    }

    const deposit = Number(booking.depositAmount || 0);
    const balanceBefore = Number(landlord.money || 0);
    const balanceAfter = balanceBefore + deposit;

    landlord.money = balanceAfter;
    await landlord.save({ transaction: t });

    // Cập nhật trạng thái booking -> paid
    booking.status = 'paid';
    await booking.save({ transaction: t });

    // Ghi lịch sử ví cho chủ phòng
    if (deposit > 0) {
      await logWalletHistory({
        t,
        userId: landlord.id,
        action: 'RECEIVE_DEPOSIT',
        amountIn: deposit,
        amountOut: 0,
        balanceBefore,
        balanceAfter,
        refType: 'BOOKING',
        note: `Nhận tiền cọc từ booking #${booking.id} (tin #${post.id})`,
      });
    }

    await t.commit();
    return {
      booking,
      landlord: {
        id: landlord.id,
        name: landlord.name,
        phone: landlord.phone,
      },
      depositAmount: deposit,
      balanceAfter,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/* ============================================================
 *  Quản trị viên: lấy toàn bộ booking đang quan tâm
 *  - Chỉ lấy:
 *      + booking.status IN ('pending', 'confirmed')
 *      + post vẫn còn tồn tại
 *  - Dùng cho màn AdminBookingManage (2 tab)
 * ==========================================================*/
exports.getAllBookingsForAdmin = async () => {
  // Dọn các booking pending đã quá hạn trước
  await autoExpirePendingBookingsInternal();

  const rows = await Booking.findAll({
    where: {
      status: {
        [Op.in]: ['pending', 'confirmed'], // không lấy paid / expired / canceled
      },
    },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Post,
        as: 'post',
        required: true,
        include: [
          {
            model: Image,
            as: 'images',
            attributes: ['id', 'url', 'isPrimary', 'sortOrder'],
            required: false,
          },
          {
            model: Video,
            as: 'videos',
            attributes: ['id', 'url'],
            required: false,
          },
        ],
      },
      {
        model: User,
        as: 'user', // người thuê
        attributes: ['id', 'name', 'phone'],
        required: true,
      },
    ],
  });

  return rows.map((b) => ({
    id: b.id,
    postId: b.postId,
    tenantId: b.userId,
    depositAmount: b.depositAmount,
    expiresAt: b.expiresAt,
    confirmedAt: b.confirmedAt,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    tenant: b.user
      ? {
          id: b.user.id,
          name: b.user.name,
          phone: b.user.phone,
        }
      : null,
    post: mapPost(b.post),
  }));
};

/* Export thêm hàm để nếu sau này muốn chạy cron */
exports.autoExpirePendingBookings = autoExpirePendingBookingsInternal;
