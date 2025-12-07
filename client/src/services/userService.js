// src/services/userService.js
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
    const msg =
      json?.message ||
      json?.error ||
      `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.raw = json;
    throw err;
  }

  return json;
}

// Cập nhật thông tin cá nhân (hiện tại chỉ name)
async function updateProfile(payload) {
  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(res); // { success, user, message }
}

// Đổi mật khẩu
async function changePassword(oldPassword, newPassword) {
  const res = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  return handleJsonResponse(res); // { success, message }
}

// Đổi vai trò (0: người thuê, 1: người cho thuê)
async function changeRole(newRole) {
  const res = await fetch(`${API_BASE}/api/auth/change-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ role: newRole }),
  });

  return handleJsonResponse(res); // { success, user, message }
}

const userService = {
  updateProfile,
  changePassword,
  changeRole,
};

export default userService;
