const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    // backend trả message thì ném ra
    throw new Error(data.message || "Đăng ký thất bại");
  }
  return data;
}
