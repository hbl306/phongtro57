// src/containers/System/PostList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listMyPosts } from "../../services/postService";
import { Link, useNavigate } from "react-router-dom";
import logoPost from "../../assets/logopost.jpg";
import HOTIcon from "../../assets/HOT.png";
import VIP1Icon from "../../assets/VIP1.png";
import VIP2Icon from "../../assets/VIP2.png";
import VIP3Icon from "../../assets/VIP3.png";
import LabelModal from "../../utils/LabelModal.jsx";
import ExtendModal from "../../utils/ExtendModal.jsx";
import HidePostModal from "../../utils/HidePostModal.jsx";

function statusInfo(status) {
  switch (status) {
    case "approved":
      return {
        label: "Đang hiển thị",
        className: "text-green-600",
        boxClass: "bg-[#f3fff6] border-green-200",
        note: "(Được duyệt bởi Hệ thống)",
      };
    case "hidden":
      return {
        label: "Tin ẩn",
        className: "text-gray-700",
        boxClass: "bg-gray-50 border-gray-200",
        note: "(Tin đang bị ẩn)",
      };
    case "expired":
      return {
        label: "Hết hạn",
        className: "text-red-600",
        boxClass: "bg-red-50 border-red-200",
        note: "(Tin đã hết hạn hiển thị)",
      };
    case "pending":
    default:
      return {
        label: "Đang chờ duyệt",
        className: "text-yellow-600",
        boxClass: "bg-yellow-50 border-yellow-200",
        note: "(Đang chờ duyệt bởi Hệ thống)",
      };
  }
}

/** Logo + màu cho từng loại nhãn */
const LABEL_META = {
  HOT: {
    code: "HOT",
    name: "HOT",
    icon: HOTIcon,
    titleClass: "text-red-600",
    chipBgClass: "bg-red-50",
    chipBorderClass: "border-red-300",
  },
  VIP1: {
    code: "VIP1",
    name: "VIP1",
    icon: VIP1Icon,
    titleClass: "text-pink-500",
    chipBgClass: "bg-pink-50",
    chipBorderClass: "border-pink-300",
  },
  VIP2: {
    code: "VIP2",
    name: "VIP2",
    icon: VIP2Icon,
    titleClass: "text-yellow-500",
    chipBgClass: "bg-yellow-50",
    chipBorderClass: "border-yellow-300",
  },
  VIP3: {
    code: "VIP3",
    name: "VIP3",
    icon: VIP3Icon,
    titleClass: "text-blue-600",
    chipBgClass: "bg-blue-50",
    chipBorderClass: "border-blue-300",
  },
  NONE: {
    code: "",
    name: "Thường",
    icon: null,
    titleClass: "text-amber-800", // nâu
    chipBgClass: "bg-amber-50",
    chipBorderClass: "border-amber-300",
  },
};

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all | approved | expired | hidden
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  // state mở 3 modal
  const [labelModalPost, setLabelModalPost] = useState(null);
  const [extendModalPost, setExtendModalPost] = useState(null);
  const [hideModalPost, setHideModalPost] = useState(null);

  // Lấy danh sách tin của user
 useEffect(() => {
  let ignore = false;

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await listMyPosts();

      // 🔥 Lọc bỏ các tin booking / booked
      const visiblePosts = data.filter(
        (p) => p.status !== "booking" && p.status !== "booked"
      );

      if (!ignore) setPosts(visiblePosts);
    } catch (err) {
      console.error("Lỗi tải tin đã đăng:", err);
    } finally {
      if (!ignore) setLoading(false);
    }
  };

  fetchData();
  return () => {
    ignore = true;
  };
}, []);


  // Đếm số lượng theo trạng thái cho các tab
  const counts = useMemo(() => {
    const c = {
      all: posts.length,
      approved: 0,
      expired: 0,
      hidden: 0,
    };
    posts.forEach((p) => {
      if (p.status === "approved" || p.status === "pending") c.approved += 1;
      if (p.status === "hidden") c.hidden += 1;
      if (p.status === "expired") c.expired += 1;
    });
    return c;
  }, [posts]);

  // Lọc theo tab + ô tìm kiếm
  const filteredPosts = useMemo(() => {
    let arr = [...posts];

    if (activeTab === "approved") {
      arr = arr.filter(
        (p) => p.status === "approved" || p.status === "pending"
      );
    } else if (activeTab === "hidden") {
      arr = arr.filter((p) => p.status === "hidden");
    } else if (activeTab === "expired") {
      arr = arr.filter((p) => p.status === "expired");
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          String(p.id).toLowerCase().includes(q)
      );
    }
    return arr;
  }, [posts, activeTab, search]);

  // callback sau khi modal gắn nhãn thành công
  const handleLabelUpdated = (payload) => {
    if (!payload) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === payload.id ? { ...p, labelCode: payload.labelCode } : p
      )
    );
  };

  // callback sau khi modal gia hạn thành công
  const handleExtendUpdated = (payload) => {
    if (!payload) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === payload.id
          ? {
              ...p,
              star: payload.star,
              status: payload.status,
              createdAt: payload.createdAt,
            }
          : p
      )
    );
  };

  // callback sau khi ẩn tin thành công
  const handleHideUpdated = (payload) => {
    if (!payload) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === payload.id ? { ...p, status: payload.status } : p
      )
    );
  };

  return (
    <div className="flex-1 bg-[#f5f5f5] min-h-[calc(100vh-52px)]">
      <div className="max-w-[1100px] mx-auto py-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[28px] font-semibold text-gray-900">
            Danh sách tin đăng
          </h1>
          <Link
            to="/quan-ly/dang-tin-moi"
            className="px-4 py-2 rounded-md bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            + Đăng tin mới
          </Link>
        </div>

        {/* tab nhỏ */}
        <div className="flex gap-6 border-b border-gray-200 mb-6 text-sm">
          <button
            className={`py-3 border-b-2 ${
              activeTab === "all"
                ? "border-orange-500 text-orange-500 font-medium"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả ({counts.all})
          </button>
          <button
            className={`py-3 border-b-2 ${
              activeTab === "approved"
                ? "border-orange-500 text-orange-500 font-medium"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("approved")}
          >
            Đang hiển thị ({counts.approved})
          </button>
          <button
            className={`py-3 border-b-2 ${
              activeTab === "expired"
                ? "border-orange-500 text-orange-500 font-medium"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("expired")}
          >
            Hết hạn ({counts.expired})
          </button>
          <button
            className={`py-3 border-b-2 ${
              activeTab === "hidden"
                ? "border-orange-500 text-orange-500 font-medium"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("hidden")}
          >
            Tin ẩn ({counts.hidden})
          </button>
        </div>

        {/* ô tìm kiếm */}
        <div className="max-w-[360px] mb-7">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã tin hoặc tiêu đề"
              className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 pl-10 outline-none focus:ring-2 focus:ring-orange-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* nội dung */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 py-10 flex justify-center">
            <p className="text-gray-500">Đang tải danh sách tin đăng...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-gray-200 py-16 flex flex-col items-center">
            <p className="text-gray-700 font-medium mb-2">
              Tìm thấy 0 tin đăng
            </p>
            <p className="text-gray-500">
              Bấm{" "}
              <Link
                to="/quan-ly/dang-tin-moi"
                className="text-blue-600 underline"
              >
                vào đây
              </Link>{" "}
              để bắt đầu đăng tin
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((p) => {
              const info = statusInfo(p.status);

              const labelKey = (p.labelCode || "").toUpperCase();
              const labelMeta = LABEL_META[labelKey] || LABEL_META.NONE;
              const titleClass = labelMeta.titleClass || "text-[#055699]";

              const thumbnail =
                (Array.isArray(p.images) && (p.images[0]?.url || p.images[0])) ||
                p.coverImage ||
                logoPost;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col md:flex-row gap-4"
                >
                  {/* Ảnh bên trái – bấm vào mở chi tiết */}
                  <Link
                    to={`/bai-dang/${p.id}`}
                    className="w-full md:w-[210px] h-[130px] rounded-md overflow-hidden relative flex-shrink-0"
                  >
                    <img
                      src={thumbnail}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Số lượng ảnh */}
                    {Array.isArray(p.images) && p.images.length > 0 && (
                      <div className="absolute left-2 bottom-2 bg-black/60 text-white text-[11px] px-2 py-[2px] rounded-full flex items-center gap-1">
                        <span>📷</span>
                        <span>{p.images.length}</span>
                      </div>
                    )}
                  </Link>

                  {/* Thông tin bài viết */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-wide">
                        {p.categoryCode && (
                          <span className="px-2 py-[2px] rounded-sm bg-gray-100 text-gray-600">
                            {p.categoryCode}
                          </span>
                        )}

                        {/* Chip nhãn với logo */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-full border ${labelMeta.chipBgClass} ${labelMeta.chipBorderClass}`}
                        >
                          {labelMeta.icon && (
                            <img
                              src={labelMeta.icon}
                              alt={labelMeta.name}
                              className="w-8 h-4 object-contain"
                            />
                          )}
                          <span className="font-semibold text-[10px] text-gray-800">
                            {labelMeta.code || "THƯỜNG"}
                          </span>
                        </span>
                      </div>

                      {/* Tiêu đề – bấm vào mở chi tiết, đổi màu theo nhãn */}
                      <Link
                        to={`/bai-dang/${p.id}`}
                        className={`block text-[15px] font-semibold mb-1 line-clamp-2 hover:underline cursor-pointer ${titleClass}`}
                      >
                        {p.title || "(Không có tiêu đề)"}
                      </Link>

                      <div className="text-sm mb-1">
                        {p.price && (
                          <span className="font-semibold text-green-600">
                            {Number(p.price).toLocaleString("vi-VN")} đ/tháng
                          </span>
                        )}
                        {p.area && (
                          <>
                            <span className="mx-2 text-gray-400">•</span>
                            <span>{p.area} m²</span>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {p.address}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 mt-1">
                      <span>Mã tin: {String(p.id).slice(0, 8)}...</span>
                      {p.createdAt && (
                        <span>
                          Ngày đăng:{" "}
                          {new Date(p.createdAt).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Khung chức năng bên phải */}
                  <div className="w-full md:w-[240px]">
                    <div
                      className={`border rounded-xl px-4 py-3 flex flex-col items-center text-center shadow-sm ${info.boxClass}`}
                    >
                      <p
                        className={`text-[15px] font-semibold mb-2 ${info.className}`}
                      >
                        {info.label}
                      </p>

                      <div className="flex flex-wrap gap-2 justify-center mb-3">
                        {p.status === "approved" || p.status === "pending" ? (
                          <>
                            <button
                              onClick={() =>
                                navigate(`/quan-ly/tin-dang/sua-tin/${p.id}`)
                              }
                              className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Sửa tin
                            </button>
                            <button
                              onClick={() => setLabelModalPost(p)}
                              className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Gắn nhãn
                            </button>
                            <button
                              onClick={() => setExtendModalPost(p)}
                              className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Gia hạn
                            </button>
                            <button
                              onClick={() => setHideModalPost(p)}
                              className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Ẩn tin
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              navigate(`/quan-ly/tin-dang/dang-lai/${p.id}`)
                            }
                            className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Đăng lại
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400">{info.note}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3 modal dùng chung */}
      <LabelModal
        open={!!labelModalPost}
        post={labelModalPost}
        onClose={() => setLabelModalPost(null)}
        onUpdated={handleLabelUpdated}
      />
      <ExtendModal
        open={!!extendModalPost}
        post={extendModalPost}
        onClose={() => setExtendModalPost(null)}
        onUpdated={handleExtendUpdated}
      />
      <HidePostModal
        open={!!hideModalPost}
        post={hideModalPost}
        onClose={() => setHideModalPost(null)}
        onUpdated={handleHideUpdated}
      />
    </div>
  );
}
