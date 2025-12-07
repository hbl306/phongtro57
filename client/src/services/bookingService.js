// src/services/bookingService.js

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

  if (!res.ok || !json?.success) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.raw = json;
    throw err;
  }

  return json;
}

/**
 * Lấy danh sách booking của user đang đăng nhập (người thuê)
 */
async function getBookingsOfUser() {
  const res = await fetch(`${API_BASE}/api/bookings/mine`, {
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
 * Lấy danh sách booking của người cho thuê (các tin của mình bị đặt)
 */
async function getBookingsOfLandlord() {
  const res = await fetch(`${API_BASE}/api/bookings/mine-as-landlord`, {
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
 * Người thuê xác nhận đặt phòng
 */
async function confirmBooking(bookingId) {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const json = await handleJsonResponse(res);
  return {
    ...(json.data || {}),
    message: json.message,
  };
}

/**
 * Người thuê hủy đặt phòng (hoàn cọc / hết hạn)
 */
async function cancelBooking(bookingId) {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const json = await handleJsonResponse(res);
  return {
    ...(json.data || {}),
    message: json.message,
  };
}
/**
 * Quản trị viên: lấy toàn bộ booking
 */
async function adminGetAllBookings() {
  const res = await fetch(`${API_BASE}/api/admin/bookings`, {
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
 * Quản trị viên: gửi tiền cọc cho chủ phòng
 */
async function adminSendDeposit(bookingId) {
  const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/send-deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const json = await handleJsonResponse(res);
  return {
    ...(json.data || {}),
    message: json.message,
  };
}


const bookingService = {
  getBookingsOfUser,
  getBookingsOfLandlord,
  confirmBooking,
  cancelBooking,
  adminGetAllBookings,
  adminSendDeposit,
};
 
export default bookingService;
