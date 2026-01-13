// Base URL của API (lấy từ .env hoặc mặc định localhost:5000) 
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ----------------------------------------------
 *  Hàm chuẩn hoá URL media (ảnh / video file)
 * ---------------------------------------------*/
export function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return `${API_BASE}${url.replace('/api', '')}`;
  }
  return url;
}

/* ----------------------------------------------
 *  Chuẩn hoá URL video
 * ---------------------------------------------*/
export function normalizeVideo(url) {
  if (!url) return null;

  if (url.startsWith('/uploads/') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { type: 'file', src: mediaUrl(url) };
  }

  const yt =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i.exec(url);
  if (yt?.[1]) {
    return {
      type: 'youtube',
      src: `https://www.youtube.com/embed/${yt[1]}`,
    };
  }

  const tt1 = /tiktok\.com\/@[^/]+\/video\/(\d+)/i.exec(url);
  const tt2 = /tiktok\.com\/([^/?#]+)?video\/(\d+)/i.exec(url);
  const ttid = tt1?.[1] || tt2?.[2];
  if (ttid) {
    return { type: 'tiktok', src: `https://www.tiktok.com/embed/v2/${ttid}` };
  }

  return { type: 'external', src: url };
}

/* ----------------------------------------------
 *  Helper: Lấy header Authorization từ pt_token
 * ---------------------------------------------*/
function getAuthHeaders() {
  const token = localStorage.getItem('pt_token');
  if (!token) {
    throw new Error('Bạn chưa đăng nhập hoặc thiếu pt_token trong localStorage');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/* ----------------------------------------------
 *  Lấy LIST bài đăng public
 * ---------------------------------------------*/
export async function listPosts(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) params.set('category', filters.category);

  if (filters.province) params.set('province', filters.province);
  if (filters.district) params.set('district', filters.district);
  if (filters.ward) params.set('ward', filters.ward);

  if (filters.price) params.set('price', filters.price);
  if (filters.area) params.set('area', filters.area);

  if (filters.status) {
    params.set('status', filters.status);
  } else {
    params.set('status', 'public');
  }

  const feats = filters.features;
  if (Array.isArray(feats) && feats.length) {
    params.set('features', feats.join(','));
  } else if (typeof feats === 'string' && feats.trim()) {
    params.set('features', feats.trim());
  }

  const qs = params.toString();
  const url = qs ? `${API_BASE}/api/posts?${qs}` : `${API_BASE}/api/posts`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Không tải được danh sách bài đăng');
  }

  return (json?.data || []).map((p) => ({
    id: p.id,
    userId: p.userId || p.user_id,
    title: p.title,
    price: p.price ?? null,
    area: p.area ?? null,
    address: p.address || '',
    province: p.province || '',
    district: p.district || '',
    ward: p.ward || '',
    street: p.street || '',
    labelCode: p.labelCode || '',
    categoryCode: p.categoryCode || '',
    description: p.description || '',
    contactName: p.contact_name || '',
    contactPhone: p.contact_phone || '',
    createdAt: p.createdAt || p.created_at,
    status: p.status || 'pending',
    star: p.star ?? 0,
    hasVideo: Array.isArray(p.videos) && p.videos.length > 0,
    images: Array.isArray(p.images) ? p.images.map((i) => mediaUrl(i.url)) : [],
  }));
}

/* ----------------------------------------------
 *  Lấy CHI TIẾT 1 bài đăng
 * ---------------------------------------------*/
export async function getPostById(id) {
  const res = await fetch(`${API_BASE}/api/posts/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || 'Không tải được bài đăng');

  const p = json?.data || {};
  return {
    id: p.id,
    userId: p.userId || p.user_id || null,
    title: p.title,
    price: p.price ?? null,
    area: p.area ?? null,
    address: p.address || '',
    province: p.province || '',
    district: p.district || '',
    ward: p.ward || '',
    street: p.street || '',
    labelCode: p.labelCode || '',
    categoryCode: p.categoryCode || '',
    description: p.description || '',
    features: Array.isArray(p.features) ? p.features : [],
    contactName: p.contact_name || '',
    contactPhone: p.contact_phone || '',
    createdAt: p.createdAt || p.created_at,
    status: p.status || 'pending',
    star: p.star ?? 0,
    images: Array.isArray(p.images)
      ? p.images.map((i) => mediaUrl(i.url))
      : [],
    videos: Array.isArray(p.videos)
      ? p.videos.map((v) => normalizeVideo(v.url)).filter(Boolean)
      : [],
  };
}

/* ----------------------------------------------
 *  TẠO BÀI ĐĂNG MỚI
 * ---------------------------------------------*/
export async function createPost(payload) {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Đăng tin thất bại');
  }

  return json;
}

/* ----------------------------------------------
 *  CẬP NHẬT BÀI ĐĂNG
 * ---------------------------------------------*/
export async function updatePost(id, payload) {
  const safePayload = { ...payload };
  delete safePayload.labelCode;

  const res = await fetch(`${API_BASE}/api/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(safePayload),
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Cập nhật tin thất bại');
  }

  return json;
}

/* ----------------------------------------------
 *  Lấy DANH SÁCH TIN của user đang đăng nhập
 * ---------------------------------------------*/
export async function listMyPosts() {
  const res = await fetch(`${API_BASE}/api/posts/mine`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || 'Không tải được tin đã đăng');
  }

  return (json?.data || []).map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price ?? null,
    area: p.area ?? null,
    address: p.address || '',
    province: p.province || '',
    district: p.district || '',
    ward: p.ward || '',
    street: p.street || '',
    labelCode: p.labelCode || '',
    categoryCode: p.categoryCode || '',
    description: p.description || '',
    contactName: p.contact_name || '',
    contactPhone: p.contact_phone || '',
    status: p.status || 'pending',
    star: p.star ?? 0,
    createdAt: p.createdAt || p.created_at,
    hasVideo: Array.isArray(p.videos) && p.videos.length > 0,
    images: Array.isArray(p.images) ? p.images.map((i) => mediaUrl(i.url)) : [],
  }));
}

/* ----------------------------------------------
 *  GẮN / ĐỔI NHÃN CHO BÀI ĐĂNG
 * ---------------------------------------------*/
export async function updatePostLabel(id, labelCode) {
  const res = await fetch(`${API_BASE}/api/posts/${id}/label`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ labelCode }),
  });

  const json = await res.json();

  if (!res.ok || !json?.success) {
    const err = new Error(json?.message || 'Cập nhật nhãn thất bại');
    err.status = res.status;
    if (json) {
      err.code = json.code;
      err.balance = json.balance;
      err.needed = json.needed;
    }
    throw err;
  }

  return json;
}

/* ----------------------------------------------
 *  GIA HẠN BÀI ĐĂNG
 * ---------------------------------------------*/
export async function extendPost(id, days) {
  const res = await fetch(`${API_BASE}/api/posts/${id}/extend`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ days }),
  });

  const json = await res.json();

  if (!res.ok || !json?.success) {
    const err = new Error(json?.message || 'Gia hạn tin thất bại');
    err.status = res.status;
    if (json) {
      err.code = json.code;
      err.balance = json.balance;
      err.needed = json.needed;
    }
    throw err;
  }

  return json;
}

/* ----------------------------------------------
 *  ĐĂNG LẠI BÀI ĐĂNG (GIỮ NGUYÊN ID)
 * ---------------------------------------------*/
export async function repostPost(id, payload) {
  const res = await fetch(`${API_BASE}/api/posts/${id}/repost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok || !json?.success) {
    const err = new Error(json?.message || 'Đăng lại tin thất bại');
    err.status = res.status;
    if (json) {
      err.code = json.code;
      err.balance = json.balance;
      err.needed = json.needed;
    }
    throw err;
  }

  return json;
}

/* ----------------------------------------------
 *  ẨN BÀI ĐĂNG
 * ---------------------------------------------*/
export async function hidePost(id) {
  const res = await fetch(`${API_BASE}/api/posts/${id}/hide`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Ẩn tin thất bại');
  }

  return json;
}

/* ----------------------------------------------
 *  ĐẶT PHÒNG
 *  - POST /api/posts/:id/booking
 * ---------------------------------------------*/
export async function bookPost(id) {
  const res = await fetch(`${API_BASE}/api/posts/${id}/booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({}), // server tự tính tiền cọc
  });

  const json = await res.json();

  if (!res.ok || !json?.success) {
    const err = new Error(json?.message || 'Đặt phòng thất bại');
    err.status = res.status;
    if (json) {
      err.code = json.code;
      err.balance = json.balance;
      err.needed = json.needed;
    }
    throw err;
  }

  return json;
}
/* ----------------------------------------------
 *  TẠO REPORT (BÁO XẤU)
 *  POST /api/posts/:id/report
 * ---------------------------------------------*/
export async function createReport(postId, payload) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Gửi phản ánh thất bại");
  }

  return json;
}
