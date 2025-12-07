// server/src/config/rechargeConfig.js

export const RECHARGE_BANK = {
  bankCode: process.env.RECHARGE_BANK_CODE || "BIDV",
  accountNumber: process.env.RECHARGE_BANK_ACCOUNT || "5210386707",
  accountName: process.env.RECHARGE_BANK_NAME || "NGUYEN QUOC DAI",
};

// URL VietQR dùng img.vietqr.io
export function buildVietQRUrl(amount, content) {
  const { bankCode, accountNumber } = RECHARGE_BANK;

  const base = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-qr_only.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
  });

  return `${base}?${params.toString()}`;
}
