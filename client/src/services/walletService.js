// client/src/services/walletService.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getAuthHeaders() {
  const token = localStorage.getItem("pt_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function handleJsonResponse(res) {
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error("Không đọc được dữ liệu từ server");
  }

  if (!res.ok || json?.success === false) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.raw = json;
    throw err;
  }

  return json;
}

/**
 * Lịch sử giao dịch ví (wallet_history) của user
 */
async function getWalletHistory() {
  const res = await fetch(`${API_BASE}/api/wallet/history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const json = await handleJsonResponse(res);
  return Array.isArray(json.data) ? json.data : [];
}

/**
 * Tạo lệnh nạp tiền VietQR
 * body: { amount }
 * trả về: { topupId, code, amount, qrUrl, bank }
 */
async function createRecharge(amount) {
  const res = await fetch(`${API_BASE}/api/wallet/recharge/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ amount }),
  });

  const json = await handleJsonResponse(res);
  return json.data; // object từ BE
}
/**
 * Lịch sử nạp tiền (RECHARGE)
 */
async function getRechargeHistory() {
  const res = await fetch(`${API_BASE}/api/wallet/recharge-history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const json = await handleJsonResponse(res);
  return Array.isArray(json.data) ? json.data : [];
}

const walletService = {
  getWalletHistory,
  createRecharge,
   getRechargeHistory,
};

export default walletService;
