// src/services/commentService.js
const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

/** Lấy danh sách bình luận của 1 bài đăng */
export async function listComments(postId) {
  if (!postId) return [];
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`);
  const json = await res.json();

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Không tải được bình luận");
  }
  // kỳ vọng BE trả về mảng [{ id, name, content, createdAt, userId }]
  return json.data || [];
}

/** Tạo bình luận mới cho 1 bài đăng */
export async function createComment(postId, payload) {
  if (!postId) throw new Error("Thiếu postId");

  // Nếu có token thì gửi kèm, không có vẫn cho comment được
  const token = localStorage.getItem("pt_token") || null;
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Gửi bình luận thất bại");
  }

  // kỳ vọng BE trả về comment vừa tạo
  return json.data;
}
