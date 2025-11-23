// src/utils/timeAgo.js
export function timeAgo(input) {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  const min = Math.floor(sec / 60);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (hr < 1) {
    // dưới 1 giờ: phút
    return `${Math.max(1, min)} phút trước`;
  }
  if (day < 1) {
    // dưới 1 ngày: giờ
    return `${Math.max(1, hr)} giờ trước`;
  }
  // từ 1 ngày trở lên: ngày
  return `${Math.max(1, day)} ngày trước`;
}
