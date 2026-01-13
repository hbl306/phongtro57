const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function getUnreadSummary(token) {
  const res = await fetch(`${API_BASE}/api/chat/unread/summary`, {
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  return parseJson(res);
}

export async function getOrCreateMyConversation(token) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/me`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  return parseJson(res);
}

export async function fetchMessages(token, conversationId, { limit = 50 } = {}) {
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages?limit=${limit}`,
    { headers: { "Content-Type": "application/json", ...authHeaders(token) } }
  );
  return parseJson(res);
}

export async function adminListConversations(token, { limit = 50, q = "" } = {}) {
  const url = new URL(`${API_BASE}/api/admin/chat/conversations`);
  url.searchParams.set("limit", String(limit));
  if (q) url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  return parseJson(res);
}

export async function dmListConversations(token, { limit = 50, q = "" } = {}) {
  const url = new URL(`${API_BASE}/api/chat/dm/conversations`);
  url.searchParams.set("limit", String(limit));
  if (q) url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  return parseJson(res);
}

export async function dmGetOrCreateConversation(token, peerId) {
  const res = await fetch(`${API_BASE}/api/chat/dm/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ peerId }),
  });
  return parseJson(res);
}
