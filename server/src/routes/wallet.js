// server/src/routes/wallet.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken');
const walletController = require('../controllers/wallet');

// Lịch sử ví của user
router.get(
  '/history',
  verifyToken,
  walletController.getMyWalletHistory
);

// Tạo yêu cầu nạp tiền VietQR
router.post(
  '/recharge/create',
  verifyToken,
  walletController.createRecharge
);

// TEST: áp dụng topup thủ công (Postman)
router.post(
  '/topup/manual',
  walletController.manualApplyTopup
);

// Webhook ngân hàng / dịch vụ sao kê
router.post(
  '/webhook/bank',
  walletController.bankWebhook
);
// Lịch sử nạp tiền của user
router.get(
  '/recharge-history',
  verifyToken,
  walletController.getMyRechargeHistory
);


module.exports = router;
