const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, { method = "GET", token, body } = {}) {
  const authToken = token || localStorage.getItem("token"); // tùy AuthContext bạn lưu key gì
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  // backend bạn đang trả { success, data } → lấy data
  return data.data ?? data;
}

const adminStatsService = {
  // Dashboard
  getDashboardStats(token) {
    return request("/api/admin/dashboard", { token });
  },
};

export default adminStatsService;
