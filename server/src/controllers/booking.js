// src/controllers/booking.js
const bookingService = require('../services/booking');

/* ============================================================
 *  Người thuê: /api/bookings/mine
 * ==========================================================*/
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định user' });
    }

    const rows = await bookingService.getBookingsOfUser(userId);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMyBookings error >>>', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Không lấy được danh sách đặt phòng',
    });
  }
};

/* ============================================================
 *  Người cho thuê: /api/bookings/mine-as-landlord
 * ==========================================================*/
exports.getLandlordBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định user' });
    }

    const rows = await bookingService.getBookingsOfLandlord(userId);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getLandlordBookings error >>>', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Không lấy được danh sách phòng được đặt cọc',
    });
  }
};

/* ============================================================
 *  Người thuê xác nhận đặt phòng
 *  POST /api/bookings/:id/confirm
 * ==========================================================*/
exports.confirmBooking = async (req, res) => {
  try {
    const userId = req.user?.id;
    const bookingId = req.params.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định user' });
    }

    const result = await bookingService.confirmBooking(bookingId, userId);

    const payload = {
      bookingId,
      bookingStatus: result.booking?.status,
      postId: result.post?.id || result.booking?.postId,
      postStatus: result.post?.status,
      refundedAmount: result.refundedAmount || 0,
      balance: result.balance,
      expired: !!result.expired,
    };

    const message = result.expired
      ? 'Đặt phòng đã hết hạn, hệ thống đã hoàn lại tiền cọc cho bạn.'
      : 'Xác nhận đặt phòng thành công.';

    return res.json({ success: true, data: payload, message });
  } catch (err) {
    console.error('confirmBooking error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Xác nhận đặt phòng thất bại',
    });
  }
};

/* ============================================================
 *  Người thuê hủy đặt phòng
 *  POST /api/bookings/:id/cancel
 * ==========================================================*/
exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.user?.id;
    const bookingId = req.params.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định user' });
    }

    const result = await bookingService.cancelBooking(bookingId, userId);

    const payload = {
      bookingId,
      bookingStatus: result.booking?.status,
      postId: result.post?.id || result.booking?.postId,
      postStatus: result.post?.status,
      refundedAmount: result.refundedAmount || 0,
      balance: result.balance,
      expired: !!result.expired,
    };

    const message = result.expired
      ? 'Đặt phòng đã hết hạn, hệ thống đã hoàn lại tiền cọc cho bạn.'
      : 'Hủy đặt phòng thành công, hệ thống đã hoàn lại tiền cọc.';

    return res.json({ success: true, data: payload, message });
  } catch (err) {
    console.error('cancelBooking error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Hủy đặt phòng thất bại',
    });
  }
};

/* ============================================================
 *  Quản trị viên: /api/admin/bookings
 *  - Xem toàn bộ phòng đang đặt / đã xác nhận
 * ==========================================================*/
exports.adminGetAllBookings = async (req, res) => {
  try {
    const role = Number(req.user?.role);

    if (!req.user || role !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản trị viên được xem danh sách phòng đặt',
      });
    }

    const rows = await bookingService.getAllBookingsForAdmin();
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('adminGetAllBookings error >>>', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Không lấy được danh sách phòng đặt',
    });
  }
};
/* ============================================================
 *  Quản trị viên: gửi tiền cọc cho chủ phòng
 *  POST /api/admin/bookings/:id/send-deposit
 * ==========================================================*/
exports.adminSendDeposit = async (req, res) => {
  try {
    const role = req.user?.role;
    if (Number(role) !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản trị viên được phép gửi tiền cọc',
      });
    }

    const bookingId = req.params.id;

    const result = await bookingService.adminSendDepositToLandlord(bookingId);

    return res.json({
      success: true,
      data: {
        bookingId,
        bookingStatus: result.booking.status,
        landlord: result.landlord,
        depositAmount: result.depositAmount,
        balance: result.balanceAfter,
      },
      message: 'Đã chuyển tiền cọc cho chủ phòng.',
    });
  } catch (err) {
    console.error('adminSendDeposit error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Gửi tiền cọc thất bại',
    });
  }
};
