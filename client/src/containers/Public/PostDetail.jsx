// src/containers/Public/PostDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import CategoryTabs from "../../components/filters/CategoryTabs";
import MediaGallery from "../../components/media/MediaGallery";
import { getPostById } from "../../services/postService";
import Footer from  "../../components/layout/Footer";
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
const CleanPhone = (s = "") => (s.match(/\d+/g) || []).join("");

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getPostById(id);
        setPost(data);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const mapSrc = useMemo(() => {
    const q = encodeURIComponent(post?.address || "");
    return q
      ? `https://www.google.com/maps?q=${q}&output=embed`
      : "";
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb]">
        <Header />
        <div className="max-w-[1150px] mx-auto px-3 md:px-6 py-10 text-gray-500">
          Đang tải chi tiết…
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f7f8fb]">
        <Header />
        <div className="max-w-[1150px] mx-auto px-3 md:px-6 py-10 text-gray-500">
          Không tìm thấy bài đăng.
        </div>
      </div>
    );
  }

  const zalo = `https://zalo.me/${CleanPhone(post.contactPhone)}`;

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <Header />

      {/* Tabs (tự highlight theo router của bạn, giữ nguyên) */}
      <div className="max-w-[1150px] mx-auto px-3 md:px-6">
        <CategoryTabs />
      </div>

      <main className="max-w-[1150px] mx-auto px-3 md:px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <section className="col-span-12 lg:col-span-8 space-y-5">
          {/* Media */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <MediaGallery images={post.images} videos={post.videos} />
          </div>

          {/* Title + price + area + address + time */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <h1 className="text-2xl font-semibold text-[#e83e8c]">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
              <span className="text-emerald-600 font-semibold">
                {formatPrice(post.price)}
              </span>
              <span className="text-gray-600">{formatArea(post.area)}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{timeAgo(post.createdAt)}</span>
            </div>

            {/* Địa chỉ 2 dòng */}
            <div className="mt-1 grid sm:grid-cols-2 gap-3 text-[15px]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">🏙️</span>
                <div>
                  <div className="text-gray-500">Tỉnh thành</div>
                  <div className="text-gray-800">{post.province || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">📍</span>
                <div>
                  <div className="text-gray-500">Địa chỉ</div>
                  <div className="text-gray-800">{post.address || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          {post.description && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold text-lg mb-3">Thông tin mô tả</h3>
              <div className="whitespace-pre-line leading-7 text-gray-800">
                {post.description}
              </div>
            </div>
          )}

          {/* Nổi bật */}
          {Array.isArray(post.features) && post.features.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold text-lg mb-3">Nổi bật</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                {post.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                      ✓
                    </span>
                    <span className="text-gray-800">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map + Contact (bên dưới map) */}
          {(post.address || post.province) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Vị trí & bản đồ</h3>
              </div>
              {mapSrc ? (
                <div className="w-full h-[320px] rounded-xl overflow-hidden border">
                  <iframe
                    src={mapSrc}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="text-gray-500">Chưa có địa chỉ bản đồ.</div>
              )}

              {/* Contact 2 (dưới map) */}
              <div className="mt-2 border-t pt-4">
                <h4 className="font-semibold mb-3">Thông tin liên hệ</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                    👤
                  </span>
                  <span className="font-medium">{post.contactName || "—"}</span>
                  {post.contactPhone && (
                    <>
                      <a
                        href={`tel:${post.contactPhone}`}
                        className="px-3 py-2 rounded-full bg-emerald-500 text-white text-sm hover:bg-emerald-600"
                      >
                        {post.contactPhone}
                      </a>
                      <a
                        href={zalo}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-full bg-[#1a73e8] text-white text-sm hover:opacity-90"
                      >
                        Nhắn Zalo
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT ASIDE - Contact chính + Đặt phòng */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-6 space-y-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-20 h-20 rounded-full bg-gray-100 grid place-items-center text-2xl">
                👤
              </div>
              <div className="text-lg font-semibold">
                {post.contactName || "—"}
              </div>
              <div className="text-sm text-emerald-600">
                Đang hoạt động
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {post.contactPhone && (
                <a
                  href={`tel:${post.contactPhone}`}
                  className="w-full grid place-items-center rounded-xl h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
                >
                  {post.contactPhone}
                </a>
              )}
              <a
                href={zalo}
                target="_blank"
                rel="noreferrer"
                className="w-full grid place-items-center rounded-xl h-11 bg-[#1a73e8] hover:opacity-90 text-white font-medium"
              >
                Nhắn Zalo
              </a>

              {/* Đặt phòng (stub) */}
              <button
                type="button"
                className="w-full grid place-items-center rounded-xl h-11 border border-gray-300 hover:bg-gray-50 font-medium"
                onClick={() => alert("Chức năng Đặt phòng sẽ được tích hợp sau.")}
              >
                Đặt phòng
              </button>
            </div>
          </div>
        </aside>
      </main>
        <Footer />
    </div>
  );
}
