// src/components/listing/ListingCard.jsx
import { Link } from "react-router-dom";
import fallbackImg from "../../assets/logopost.jpg";
import { useAuth } from "../../containers/Public/AuthContext.jsx";

// 🔥 icon nhãn
import HOT_ICON from "../../assets/HOT.png";
import VIP1_ICON from "../../assets/VIP1.png";
import VIP2_ICON from "../../assets/VIP2.png";
import VIP3_ICON from "../../assets/VIP3.png";

/** 8_900_000 -> "8,9 triệu/tháng" */
function formatPrice(p) {
  if (p == null) return "—";
  const tr = p / 1_000_000;
  const val = (Math.round(tr * 10) / 10).toString().replace(".", ",");
  return `${val} triệu/tháng`;
}
function formatArea(a) {
  if (a == null) return "—";
  return `${a} m²`;
}
function snippet(text, n = 160) {
  if (!text) return "";
  const s = text.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 60) return `${m || 1} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const day = Math.floor(h / 24);
  return `${day} ngày trước`;
}

/** Màu tiêu đề theo nhãn */
function titleColorClass(labelCode) {
  const code = (labelCode || "").toUpperCase();
  switch (code) {
    case "HOT":
      return "text-red-600";
    case "VIP1":
      return "text-pink-500";
    case "VIP2":
      return "text-yellow-500";
    case "VIP3":
      return "text-blue-500";
    default:
      return "text-amber-800"; // nâu nâu
  }
}

/** chọn icon nhãn */
function labelIcon(labelCode) {
  const code = (labelCode || "").toUpperCase();
  switch (code) {
    case "HOT":
      return HOT_ICON;
    case "VIP1":
      return VIP1_ICON;
    case "VIP2":
      return VIP2_ICON;
    case "VIP3":
      return VIP3_ICON;
    default:
      return null;
  }
}

/** Card bài đăng
 *  variant = "default" | "hot"
 *  - "hot": dùng trong khung tin HOT nổi bật
 */
export default function ListingCard({ post, variant = "default" }) {
  const { user } = useAuth();

  // role: 0 = Người thuê trọ, 1 = Người cho thuê, 2 = Admin
  const role = user?.role;
  const isLandlord = role === 1;

  const isOwnPost =
    post.userId != null && user?.id != null && post.userId === user.id;

  // Người cho thuê chỉ xem tin của chính mình
  if (isLandlord && !isOwnPost) {
    return null;
  }

  const imgs = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
  const img1 = imgs[0] || fallbackImg;
  const img2 = imgs[1];
  const img3 = imgs[2];

  const PlayBadge = () =>
    post.hasVideo ? (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center shadow">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    ) : null;

  const wrapperClass =
    variant === "hot"
      ? "block w-full rounded-2xl border border-red-300 bg-white shadow-md hover:shadow-lg hover:-translate-y-[1px] transition-all"
      : "block w-full rounded-2xl border border-gray-200 bg-white shadow-[0_1px_0_#eef] hover:shadow-md hover:-translate-y-[1px] transition-all";

  const iconSrc = labelIcon(post.labelCode);

  return (
    <Link to={`/bai-dang/${post.id}`} className={wrapperClass}>
      <div className="p-4 md:p-5 grid grid-cols-12 gap-4">
        {/* LEFT: Hình ảnh */}
        <div className="col-span-12 md:col-span-5">
          {imgs.length >= 2 ? (
            <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[220px]">
              <div className="relative col-span-2 row-span-2">
                <img
                  src={img1}
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = fallbackImg)}
                />
                <PlayBadge />
              </div>

              <img
                src={img2 || fallbackImg}
                alt=""
                className="col-span-1 row-span-1 w-full h-full object-cover rounded-xl"
                loading="lazy"
                onError={(e) => (e.currentTarget.src = fallbackImg)}
              />
              <img
                src={img3 || img2 || fallbackImg}
                alt=""
                className="col-span-1 row-span-1 w-full h-full object-cover rounded-xl"
                loading="lazy"
                onError={(e) => (e.currentTarget.src = fallbackImg)}
              />
            </div>
          ) : (
            <div className="relative h-[220px]">
              <img
                src={img1}
                alt=""
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
                onError={(e) => (e.currentTarget.src = fallbackImg)}
              />
              <PlayBadge />
            </div>
          )}
        </div>

        {/* RIGHT: Nội dung */}
        <div className="col-span-12 md:col-span-7 flex flex-col justify-between">
          <div className="space-y-1.5">
            {/* ⭐ Tiêu đề + icon nhãn trên cùng 1 dòng (icon bám dòng đầu) */}
            <div className="flex items-start gap-2">
              {iconSrc && (
                <img
                  src={iconSrc}
                  alt={post.labelCode}
                  className="w-10 h-auto mt-[2px] flex-shrink-0"
                />
              )}
              <h3
                className={
                  "text-lg font-semibold leading-snug line-clamp-2 " +
                  titleColorClass(post.labelCode)
                }
              >
                {post.title || "—"}
              </h3>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-emerald-600 font-semibold">
                {formatPrice(post.price)}
              </span>
              <span className="text-gray-500">{formatArea(post.area)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg leading-none">📍</span>
              <span className="line-clamp-1">
                {post.district ? `${post.district}, ` : ""}
                {post.province || post.address || ""}
              </span>
            </div>

            {post.description && (
              <p className="text-sm text-gray-700 leading-6 line-clamp-2">
                {snippet(post.description, 160)}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500">
              👤
            </span>
            <span className="font-medium">{post.contactName || "—"}</span>
            {post.contactPhone ? (
              <span className="ml-1 px-2 py-1 text-[12px] rounded-full bg-emerald-50 text-emerald-700">
                {post.contactPhone}
              </span>
            ) : null}
            <span className="ml-2 text-gray-500">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
