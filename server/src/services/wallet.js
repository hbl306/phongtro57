// server/src/services/wallet.js
const db = require('../models');
const { WalletHistory, WalletTopup, User, sequelize } = db;

/** Chuẩn hoá số tiền */
function normalizeAmount(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/** Lịch sử ví của 1 user (wallet_history) */
exports.getUserWalletHistory = async (userId) => {
  if (!userId) return [];

  const rows = await WalletHistory.findAll({
    where: { userId }, // trong model history đã mapping userId ↔ user_id
    order: [['createdAt', 'DESC']],
  });

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    amountIn: Number(r.amountIn || 0),
    amountOut: Number(r.amountOut || 0),
    balanceBefore: Number(r.balanceBefore || 0),
    balanceAfter: Number(r.balanceAfter || 0),
    refType: r.refType || null,
    note: r.note || '',
    createdAt: r.createdAt,
  }));
};

/* ----------------------- BẢNG wallet_topups ----------------------- */

/**
 * Tạo 1 lệnh nạp tiền VietQR cho user
 * -> lưu vào bảng wallet_topups
 * -> trả về thông tin để FE hiển thị QR
 *
 * ✅ CÁCH A: trả đúng format FE đang dùng:
 * {
 *   id, amount, code,
 *   bank: { bankCode, bankName, accountNumber, accountName },
 *   qrUrl
 * }
 */
exports.createVietQRTopupForUser = async (userId, rawAmount) => {
  if (!userId) {
    throw new Error('Không xác định user để nạp tiền');
  }

  const amount = normalizeAmount(rawAmount);
  if (amount < 10000) {
    throw new Error('Số tiền nạp tối thiểu là 10.000đ');
  }

  // Mã nội dung chuyển khoản, dạng PT57_<userId>_<timestamp>
  const code = `PT57_${userId}_${Date.now()}`;

  // Lưu vào bảng wallet_topups (CHÚ Ý: cột user_id, status là 'pending')
  const topup = await WalletTopup.create({
    user_id: userId,
    amount,
    code,
    status: 'pending',
  });

  // Thông tin tài khoản nhận tiền (env hoặc fallback)
  // ✅ Ưu tiên TOPUP_* (chuẩn), fallback RECHARGE_* (nếu bạn đang dùng key cũ)
  const bankAccountNumber =
    process.env.TOPUP_BANK_ACCOUNT ||
    process.env.RECHARGE_BANK_ACCOUNT ||
    '5210386707';

  const bankAccountName =
    process.env.TOPUP_BANK_ACCOUNT_NAME ||
    process.env.RECHARGE_BANK_ACCOUNT_NAME ||
    process.env.RECHARGE_BANK_NAME || // fallback thêm nếu đặt nhầm
    'NGUYEN QUOC DAI';

  const bankCode =
    process.env.TOPUP_BANK_CODE ||
    process.env.RECHARGE_BANK_CODE ||
    'BIDV';

  const bankName =
    process.env.TOPUP_BANK_NAME_DISPLAY ||
    process.env.RECHARGE_BANK_NAME_DISPLAY ||
    'BIDV';

  // Link ảnh QR từ VietQR
  const qrImageUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccountNumber}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(
    code
  )}&accountName=${encodeURIComponent(bankAccountName)}`;

  // ✅ TRẢ ĐÚNG SHAPE FE ĐANG DÙNG
  return {
    id: topup.id,
    amount,
    code,

    bank: {
      bankCode,
      bankName,
      accountNumber: bankAccountNumber,
      accountName: bankAccountName,
    },

    qrUrl: qrImageUrl,

    // (Optional) Giữ lại field cũ để không ảnh hưởng nơi khác nếu có dùng
    bankCode,
    bankName,
    bankAccountNumber,
    bankAccountName,
    qrImageUrl,
  };
};

/* ------------------- XỬ LÝ CỘNG TIỀN SAU KHI BANK BẮN ------------------- */

/** Helper: lấy mã PT57_... từ nội dung chuyển khoản */
exports.extractTopupCodeFromDescription = (desc) => {
  if (!desc) return null;
  const str = String(desc);
  const match = str.match(/PT57_\d+_\d+/i);
  return match ? match[0] : null;
};

/**
 * Xác nhận 1 topup theo code (PT57_xxx)
 * - amount: số tiền thực tế nhận (nếu không truyền -> dùng amount trong bảng topup)
 * - bankRef: mã tham chiếu ngân hàng
 * - rawData: object raw từ bank/webhook (sẽ stringify)
 *
 * Trả về: { topupId, userId, amount, balanceAfter, alreadyApplied }
 */
exports.confirmTopupByCode = async ({ code, amount, bankRef, rawData }) => {
  if (!code) {
    throw new Error('Thiếu mã nạp tiền (code)');
  }

  // Tìm topup theo code
  const topup = await WalletTopup.findOne({ where: { code } });
  if (!topup) {
    throw new Error('Không tìm thấy yêu cầu nạp tiền tương ứng');
  }

  // status trong DB: 'pending' | 'success' | 'failed'
  if (topup.status === 'success') {
    return {
      topupId: topup.id,
      userId: topup.user_id,
      amount: Number(topup.amount || 0),
      balanceAfter: null,
      alreadyApplied: true,
    };
  }

  if (topup.status === 'failed') {
    throw new Error('Yêu cầu nạp tiền này đã bị từ chối trước đó');
  }

  const finalAmount =
    normalizeAmount(amount) || normalizeAmount(topup.amount);

  if (finalAmount <= 0) {
    throw new Error('Số tiền nạp không hợp lệ');
  }

  // Transaction để đảm bảo atomic
  const result = await sequelize.transaction(async (t) => {
    // LƯU Ý: dùng topup.user_id (snake_case)
    const user = await User.findByPk(topup.user_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng để cộng tiền');
    }

    const balanceBefore = Number(user.money || 0);
    const balanceAfter = balanceBefore + finalAmount;

    // Cập nhật số dư user
    await user.update({ money: balanceAfter }, { transaction: t });

    // Cập nhật topup (status + mã tham chiếu + note)
    await topup.update(
      {
        status: 'success',
        amount: finalAmount,
        provider_txn_id: bankRef || topup.provider_txn_id || null,
        provider_note: rawData
          ? JSON.stringify(rawData).slice(0, 1000)
          : topup.provider_note || null,
        completed_at: new Date(),
      },
      { transaction: t }
    );

    // Ghi lịch sử ví
    await WalletHistory.create(
      {
        userId: user.id, // model history dùng userId ↔ user_id
        action: 'RECHARGE',
        amountIn: finalAmount,
        amountOut: 0,
        balanceBefore,
        balanceAfter,
        refType: 'BANK_VIETQR',
        note: `Nạp tiền VietQR (${code})`,
      },
      { transaction: t }
    );

    return {
      topupId: topup.id,
      userId: user.id,
      amount: finalAmount,
      balanceAfter,
      alreadyApplied: false,
    };
  });

  return result;
};

/**
 * Lịch sử nạp tiền của 1 user
 * - Ưu tiên lấy từ wallet_history (action = 'RECHARGE')
 * - Nếu chưa có, fallback sang bảng wallet_topups (status = 'success')
 */
exports.getUserRechargeHistory = async (userId) => {
  if (!userId) return [];

  // 1. Thử lấy từ bảng wallet_history
  try {
    const logs = await WalletHistory.findAll({
      where: { userId, action: 'RECHARGE' },
      order: [['createdAt', 'DESC']],
    });

    if (logs && logs.length) {
      return logs.map((r) => ({
        id: r.id,
        action: r.action,
        amountIn: Number(r.amountIn || 0),
        amountOut: Number(r.amountOut || 0),
        balanceBefore: Number(r.balanceBefore || 0),
        balanceAfter: Number(r.balanceAfter || 0),
        refType: r.refType || null,
        note: r.note || '',
        createdAt: r.createdAt,
      }));
    }
  } catch (e) {
    console.error('getUserRechargeHistory from wallet_history error >>>', e);
  }

  // 2. Nếu chưa có log trong wallet_history thì đọc từ wallet_topups
  const topups = await WalletTopup.findAll({
    where: { user_id: userId, status: 'success' },
    order: [
      ['completed_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  return topups.map((t) => ({
    id: t.id,
    action: 'RECHARGE',
    amountIn: Number(t.amount || 0),
    amountOut: 0,
    balanceBefore: null,
    balanceAfter: null,
    refType: 'BANK_VIETQR',
    note: t.provider_note || `Nạp tiền VietQR (${t.code})`,
    createdAt: t.completed_at || t.created_at,
  }));
};
