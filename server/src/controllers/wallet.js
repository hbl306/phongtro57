// server/src/controllers/wallet.js
const walletService = require('../services/wallet');

/**
 * GET /api/wallet/history
 * Lịch sử giao dịch ví của user hiện tại
 */
exports.getMyWalletHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định user' });
    }

    const rows = await walletService.getUserWalletHistory(userId);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMyWalletHistory error >>>', err);
    return res.status(500).json({
      success: false,
      message:
        err.message || 'Không lấy được lịch sử giao dịch',
    });
  }
};

/**
 * POST /api/wallet/recharge/create
 * body: { amount }
 * -> tạo lệnh nạp + thông tin QR VietQR
 */
exports.createRecharge = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định user' });
    }

    const { amount } = req.body;
    const data =
      await walletService.createVietQRTopupForUser(
        userId,
        amount
      );

    return res.json({
      success: true,
      data,
      message:
        'Tạo yêu cầu nạp tiền thành công. Vui lòng chuyển khoản đúng nội dung để hệ thống tự cộng tiền.',
    });
  } catch (err) {
    console.error('createRecharge error >>>', err);
    return res.status(400).json({
      success: false,
      message:
        err.message || 'Không tạo được yêu cầu nạp tiền',
    });
  }
};

/**
 * POST /api/wallet/topup/manual
 * Dùng để TEST trên local (bắn Postman)
 * body: { code, amount }
 */
exports.manualApplyTopup = async (req, res) => {
  try {
    const secret =
      process.env.BANK_WEBHOOK_SECRET ||
      'pt57-dev-secret';
    if (
      req.headers['x-webhook-secret'] !== secret
    ) {
      return res.status(403).json({
        success: false,
        message: 'Sai webhook secret',
      });
    }

    const { code, amount } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: 'Thiếu code' });
    }

    const result =
      await walletService.confirmTopupByCode({
        code,
        amount,
        bankRef: 'MANUAL',
        rawData: { source: 'manual' },
      });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('manualApplyTopup error >>>', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Không áp dụng topup',
    });
  }
};

/**
 * POST /api/wallet/webhook/bank
 * Endpoint để các dịch vụ sao kê/bank gọi webhook
 * Body dự kiến:
 * {
 *   "transactions": [
 *     {
 *       "amount": 100000,
 *       "description": "Chuyen tien PT57_8_...",
 *       "ref": "FT123456",
 *       "time": "2025-11-27T14:23:00+07:00"
 *     }
 *   ]
 * }
 */
exports.bankWebhook = async (req, res) => {
  try {
    const secret =
      process.env.BANK_WEBHOOK_SECRET ||
      'pt57-dev-secret';
    if (
      req.headers['x-webhook-secret'] !== secret
    ) {
      return res.status(403).json({
        success: false,
        message: 'Sai webhook secret',
      });
    }

    const payload = req.body || {};
    const list = Array.isArray(payload.transactions)
      ? payload.transactions
      : payload.transaction
      ? [payload.transaction]
      : [];

    if (!list.length) {
      return res.json({
        success: true,
        results: [],
      });
    }

    const results = [];

    for (const tx of list) {
      const amount = Number(tx.amount || 0);
      const desc =
        tx.description ||
        tx.content ||
        tx.remark ||
        '';
      const code =
        walletService.extractTopupCodeFromDescription(
          desc
        );

      if (!code || !amount) {
        results.push({
          status: 'SKIPPED',
          reason: 'Thiếu code hoặc amount',
          raw: { amount, desc },
        });
        continue;
      }

      try {
        const applyResult =
          await walletService.confirmTopupByCode({
            code,
            amount,
            bankRef:
              tx.ref ||
              tx.txId ||
              tx.transactionId ||
              null,
            rawData: tx,
          });

        results.push({
          status: applyResult.alreadyApplied
            ? 'ALREADY_APPLIED'
            : 'APPLIED',
          code,
          amount: applyResult.amount,
          balanceAfter: applyResult.balanceAfter,
        });
      } catch (err) {
        console.error(
          'bankWebhook apply error >>>',
          err
        );
        results.push({
          status: 'ERROR',
          code,
          reason: err.message,
        });
      }
    }

    return res.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error('bankWebhook error >>>', err);
    return res.status(500).json({
      success: false,
      message:
        err.message || 'Lỗi xử lý webhook ngân hàng',
    });
  }
};
/**
 * GET /api/wallet/recharge-history
 * Lịch sử nạp tiền VietQR của user hiện tại
 */
exports.getMyRechargeHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Không xác định user' });
    }

    const rows = await walletService.getUserRechargeHistory(userId);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMyRechargeHistory error >>>', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Không lấy được lịch sử nạp tiền',
    });
  }
};
