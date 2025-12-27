// src/containers/Public/PostDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import CategoryTabs from "../../components/filters/CategoryTabs";
import MediaGallery from "../../components/media/MediaGallery";
import { getPostById } from "../../services/postService";
import Footer from "../../components/layout/Footer";

import HotLabel from "../../assets/HOT.png";
import Vip1Label from "../../assets/VIP1.png";
import Vip2Label from "../../assets/VIP2.png";
import Vip3Label from "../../assets/VIP3.png";
import DefaultLabel from "../../assets/logopost.jpg";

import LabelModal from "../../utils/LabelModal.jsx";
import ExtendModal from "../../utils/ExtendModal.jsx";
import HidePostModal from "../../utils/HidePostModal.jsx";
import BookingModal from "../../utils/BookingModal.jsx";
import ReportModal from "../../utils/ReportModal.jsx";
import { useAuth } from "./AuthContext.jsx";

// 🔥 service bình luận
import {
  listComments,
  createComment,
} from "../../services/commentService.js";

// 👉 BASE API cho ảnh/video
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function resolveMediaUrl(raw) {
  if (!raw) return null;

  // Nếu là full URL
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);

      // Trường hợp cũ: ảnh/video đang trỏ về localhost / 127.x
      if (
        (u.hostname === "localhost" || u.hostname.startsWith("127.")) &&
        u.pathname.startsWith("/uploads/")
      ) {
        // Ép host sang API_BASE (devtunnel backend)
        return `${API_BASE}${u.pathname}`;
      }

      // Các host khác giữ nguyên
      return raw;
    } catch {
      return raw;
    }
  }

  // Trường hợp chỉ lưu "/uploads/xxx"
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }

  return raw;
}

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

// logo + màu tiêu đề theo label
const LABEL_CONFIG = {
  HOT: {
    color: "#e53935",
    icon: HotLabel,
  },
  VIP1: {
    color: "#e83e8c",
    icon: Vip1Label,
  },
  VIP2: {
    color: "#f9a825",
    icon: Vip2Label,
  },
  VIP3: {
    color: "#1a73e8",
    icon: Vip3Label,
  },
  DEFAULT: {
    color: "#8b5e3c",
    icon: DefaultLabel,
  },
};

function getLabelInfo(post) {
  const raw =
    (post?.label ||
      post?.labelCode ||
      post?.labelType ||
      post?.labelName ||
      "") + "";
  const key = raw.toUpperCase();
  if (key === "HOT") return LABEL_CONFIG.HOT;
  if (key === "VIP1") return LABEL_CONFIG.VIP1;
  if (key === "VIP2") return LABEL_CONFIG.VIP2;
  if (key === "VIP3") return LABEL_CONFIG.VIP3;
  return LABEL_CONFIG.DEFAULT;
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // state mở 5 modal
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // 🔥 state bình luận
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  // load post
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

  // load comments
  useEffect(() => {
    if (!id) return;
    let ignore = false;

    (async () => {
      setCommentLoading(true);
      try {
        const data = await listComments(id);
        if (!ignore) setComments(data);
      } catch (err) {
        console.error("Lỗi tải bình luận:", err);
        if (!ignore) setComments([]);
      } finally {
        if (!ignore) setCommentLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id]);

  // gửi bình luận — chỉ cho người thuê (role = 0)
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user || user.role !== 0) {
      alert("Chỉ tài khoản Người thuê trọ mới có thể bình luận.");
      return;
    }

    if (!commentContent.trim()) {
      alert("Vui lòng nhập nội dung bình luận.");
      return;
    }

    if (!user.name) {
      alert(
        "Vui lòng cập nhật họ tên trong hồ sơ tài khoản trước khi bình luận."
      );
      return;
    }

    try {
      setCommentSubmitting(true);

      const newComment = await createComment(id, {
        content: commentContent.trim(),
        name: user.name,
        userId: user.id,
      });

      // thêm bình luận mới lên đầu
      setComments((prev) => [newComment, ...prev]);
      setCommentContent("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Gửi bình luận thất bại");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // ✅ Chuẩn hoá images & videos (fix /uploads/... cho mọi máy)
  const normalizedImages = useMemo(() => {
    if (!post || !Array.isArray(post.images)) return post?.images;
    return post.images.map((img) => {
      if (typeof img === "string") {
        return resolveMediaUrl(img);
      }
      const url = img?.url || img?.src;
      const resolved = resolveMediaUrl(url);
      // giữ nguyên các field khác nếu có
      return { ...img, url: resolved };
    });
  }, [post]);

  const normalizedVideos = useMemo(() => {
    if (!post || !Array.isArray(post.videos)) return post?.videos;
    return post.videos.map((v) => {
      if (typeof v === "string") {
        return resolveMediaUrl(v);
      }
      const url = v?.url || v?.src;
      const resolved = resolveMediaUrl(url);
      return { ...v, url: resolved, src: resolved || v.src };
    });
  }, [post]);

  const mapSrc = useMemo(() => {
    const q = encodeURIComponent(post?.address || "");
    return q ? `https://www.google.com/maps?q=${q}&output=embed` : "";
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
  const { color: titleColor, icon: labelIcon } = getLabelInfo(post);
  const isLandlord = user?.role === 1;
  const canComment = user && user.role === 0;

  // callback sau khi modal gắn nhãn / gia hạn / ẩn tin
  const handleLabelUpdated = (payload) => {
    if (!payload) return;
    setPost((prev) =>
      prev ? { ...prev, labelCode: payload.labelCode } : prev
    );
  };

  const handleExtendUpdated = (payload) => {
    if (!payload) return;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            star: payload.star,
            status: payload.status,
            createdAt: payload.createdAt,
          }
        : prev
    );
  };

  const handleHideUpdated = (payload) => {
    if (!payload) return;
    setPost((prev) => (prev ? { ...prev, status: payload.status } : prev));
  };

  // callback sau khi đặt phòng xong -> cập nhật trạng thái bài
  const handleBooked = (payload) => {
    if (!payload) return;
    setPost((prev) =>
      prev ? { ...prev, status: payload.status || "booking" } : prev
    );
  };

  const handleClickBooking = () => {
    // chưa đăng nhập
    if (!user) {
      navigate("/dang-nhap-tai-khoan");
      return;
    }

    // chỉ role 0 (người thuê) mới được đặt phòng
    if (user.role !== 0) {
      alert("Chỉ tài khoản Người thuê trọ mới có thể đặt phòng.");
      return;
    }

    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <Header />

      {/* Tabs */}
      <div className="max-w-[1150px] mx-auto px-3 md:px-6">
        <CategoryTabs />
      </div>

      <main className="max-w-[1150px] mx-auto px-3 md:px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <section className="col-span-12 lg:col-span-8 space-y-5">
          {/* Media */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <MediaGallery images={normalizedImages} videos={normalizedVideos} />
          </div>

          {/* Title + price + area + address + time */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              {labelIcon && (
                <img
                  src={labelIcon}
                  alt="Loại tin"
                  className="w-9 h-9 object-contain"
                />
              )}
              <h1
                className="text-2xl font-semibold"
                style={{ color: titleColor }}
              >
                {post.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
              <span className="text-emerald-600 font-semibold">
                {formatPrice(post.price)}
              </span>
              <span className="text-gray-600">{formatArea(post.area)}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{timeAgo(post.createdAt)}</span>
            </div>

            {/* Địa chỉ: địa chỉ nằm dưới tỉnh thành */}
            <div className="mt-1 space-y-2 text-[15px]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">🏙️</span>
                <div>
                  <div className="text-gray-500">Tỉnh thành</div>
                  <div className="text-gray-800">
                    {post.province || "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">📍</span>
                <div>
                  <div className="text-gray-500">Địa chỉ</div>
                  <div className="text-gray-800">
                    {post.address || "—"}
                  </div>
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
                    title="Bản đồ"
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
                  <span className="font-medium">
                    {post.contactName || "—"}
                  </span>
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

        {/* RIGHT ASIDE */}
        <aside className="col-span-12 lg:col-span-4">
          {/* Người thuê trọ (role 0) / khách */}
          {!isLandlord ? (
            <div className="space-y-4 sticky top-6">
              {/* Khung chức năng — phiên bản thu gọn */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gray-100 grid place-items-center text-xl">
                    👤
                  </div>
                  <div className="text-base font-semibold">
                    {post.contactName || "—"}
                  </div>
                  
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  {post.contactPhone && (
                    <a
                      href={`tel:${post.contactPhone}`}
                      className="w-full grid place-items-center rounded-xl h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
                    >
                      {post.contactPhone}
                    </a>
                  )}

                  <a
                    href={zalo}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full grid place-items-center rounded-xl h-10 bg-[#1a73e8] hover:opacity-90 text-white font-medium"
                  >
                    Nhắn Zalo
                  </a>

                  <button
                    type="button"
                    className="w-full grid place-items-center rounded-xl h-10 border border-red-300 text-red-500 hover:bg-red-50 font-medium"
                    onClick={() => setReportModalOpen(true)}
                  >
                    Báo xấu
                  </button>

                  <button
                    type="button"
                    className="w-full grid place-items-center rounded-xl h-10 bg-[#ff9800] hover:bg-[#fb8c00] text-white font-medium"
                    onClick={handleClickBooking}
                  >
                    Đặt phòng
                  </button>
                </div>
              </div>

              {/* Khung bình luận — chỉ phía người thuê / khách */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[15px]">Bình luận</h3>
                  {comments.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {comments.length} bình luận
                    </span>
                  )}
                </div>

                {/* Form bình luận */}
                {canComment ? (
                  <form
                    onSubmit={handleSubmitComment}
                    className="space-y-2 mb-3"
                  >
                    <div className="text-xs text-gray-500">
                      Bình luận dưới tên{" "}
                      <span className="font-medium text-gray-800">
                        {user.name || "(Chưa có tên)"}
                      </span>
                      .
                    </div>

                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                      placeholder="Viết bình luận của bạn..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        Không chia sẻ thông tin nhạy cảm.
                      </span>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium disabled:opacity-60"
                        disabled={commentSubmitting}
                      >
                        {commentSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-3 text-xs text-gray-500 space-y-1">
                    <p>
                      Đăng nhập bằng tài khoản{" "}
                      <b className="text-gray-800">Người thuê trọ</b> để viết
                      bình luận.
                    </p>
                    {!user && (
                      <button
                        type="button"
                        onClick={() => navigate("/dang-nhap-tai-khoan")}
                        className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full border border-orange-200 text-orange-600 hover:bg-orange-50 text-[11px] font-medium"
                      >
                        Đăng nhập
                      </button>
                    )}
                  </div>
                )}

                {/* Danh sách bình luận */}
                {commentLoading && comments.length === 0 && (
                  <p className="text-xs text-gray-400">
                    Đang tải bình luận...
                  </p>
                )}

                {!commentLoading && comments.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Chưa có bình luận nào. Hãy là người đầu tiên!
                  </p>
                )}

                {comments.length > 0 && (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {comments.map((c) => {
                      const displayName =
                        c.userName ||
                        c.user_name ||
                        c.name ||
                        (c.user && c.user.name) ||
                        "Ẩn danh";

                      return (
                        <div
                          key={c.id}
                          className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-800">
                              {displayName}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[13px] text-gray-700 whitespace-pre-line">
                            {c.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Người cho thuê (role 1): 4 chức năng quản lý tin — GIỮ NGUYÊN
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-6 space-y-4">
              <div className="text-center mb-2">
                <div className="text-sm text-gray-500">
                  {post.contactName} — {post.contactPhone}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="w-full grid place-items-center rounded-xl h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  onClick={() =>
                    window.location.assign(
                      `/quan-ly/tin-dang/sua-tin/${post.id}`
                    )
                  }
                >
                  Sửa tin
                </button>

                <button
                  type="button"
                  className="w-full grid place-items-center rounded-xl h-11 border border-gray-300 hover:bg-gray-50 font-medium text-gray-800"
                  onClick={() => setLabelModalOpen(true)}
                >
                  Gắn nhãn
                </button>

                <button
                  type="button"
                  className="w-full grid place-items-center rounded-xl h-11 border border-gray-300 hover:bg-gray-50 font-medium text-gray-800"
                  onClick={() => setExtendModalOpen(true)}
                >
                  Gia hạn
                </button>

                <button
                  type="button"
                  className="w-full grid place-items-center rounded-xl h-11 border border-red-300 text-red-500 hover:bg-red-50 font-medium"
                  onClick={() => setHideModalOpen(true)}
                >
                  Ẩn tin
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* 5 modal dùng chung */}
      <LabelModal
        open={labelModalOpen}
        post={post}
        onClose={() => setLabelModalOpen(false)}
        onUpdated={handleLabelUpdated}
      />
      <ExtendModal
        open={extendModalOpen}
        post={post}
        onClose={() => setExtendModalOpen(false)}
        onUpdated={handleExtendUpdated}
      />
      <HidePostModal
        open={hideModalOpen}
        post={post}
        onClose={() => setHideModalOpen(false)}
        onUpdated={handleHideUpdated}
      />
      <BookingModal
        open={bookingModalOpen}
        post={post}
        onClose={() => setBookingModalOpen(false)}
        onBooked={handleBooked}
      />
      <ReportModal
        open={reportModalOpen}
        post={post}
        currentUser={user}
        onClose={() => setReportModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
