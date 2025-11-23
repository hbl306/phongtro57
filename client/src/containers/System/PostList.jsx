// src/containers/System/PostList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listMyPosts,
  updatePostLabel,
  extendPost,
  hidePost, // 👈 thêm import
} from "../../services/postService";
import { Link, useNavigate } from "react-router-dom";
import logoPost from "../../assets/logopost.jpg";
import HOTIcon from "../../assets/HOT.png";
import VIP1Icon from "../../assets/VIP1.png";
import VIP2Icon from "../../assets/VIP2.png";
import VIP3Icon from "../../assets/VIP3.png";
import Modal from "../../components/ui/Modal.jsx";
import { useAuth } from "../Public/AuthContext.jsx";

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

/** Thông tin nhãn: tên + giá + logo */
const LABEL_META = {
  HOT: { code: "HOT", name: "Nổi bật", price: 50000, img: HOTIcon },
  VIP1: { code: "VIP1", name: "Vip1", price: 30000, img: VIP1Icon },
  VIP2: { code: "VIP2", name: "Vip2", price: 20000, img: VIP2Icon },
  VIP3: { code: "VIP3", name: "Vip3", price: 10000, img: VIP3Icon },
};

const LABEL_OPTIONS = ["", "HOT", "VIP1", "VIP2", "VIP3"]; // '' = không gắn nhãn

/** Option gia hạn */
const EXTEND_OPTIONS = [
  { days: 3, price: 15000 },
  { days: 7, price: 30000 },
  { days: 30, price: 135000 },
];
const EXTEND_PRICE = {
  3: 15000,
  7: 30000,
  30: 135000,
};

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function renderLabelBadge(code, extraClass = "") {
  const c = (code || "").toUpperCase();
  const meta = LABEL_META[c];
  if (!meta) {
    return (
      <span
        className={
          "inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs " +
          extraClass
        }
      >
        Không gắn nhãn
      </span>
    );
  }
  return (
    <span
      className={
        "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-orange-200 text-xs " +
        extraClass
      }
    >
      <img
        src={meta.img}
        alt={meta.name}
        className="w-10 h-6 object-contain rounded-[4px]"
      />
      <span className="font-medium">{meta.name}</span>
    </span>
  );
}

/** Tính ngày hết hạn = createdAt + star (ngày) */
function calcExpireDate(createdAt, star) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  const days = Number(star || 0);
  if (days > 0) d.setDate(d.getDate() + days);
  return d;
}

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all | approved | expired | hidden
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // state popup gắn nhãn
  const [labelModalPost, setLabelModalPost] = useState(null); // post đang gắn nhãn
  const [selectedLabel, setSelectedLabel] = useState(""); // code nhãn đang chọn
  const [changingLabel, setChangingLabel] = useState(false);

  // state popup gia hạn
  const [extendModalPost, setExtendModalPost] = useState(null);
  const [extendDays, setExtendDays] = useState(3); // mặc định 3 ngày
  const [extending, setExtending] = useState(false);

  // state popup ẩn tin
  const [hideModalPost, setHideModalPost] = useState(null);
  const [hiding, setHiding] = useState(false);

  // Lấy danh sách tin của user
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await listMyPosts();
        if (!ignore) setPosts(data);
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
      // Đang hiển thị = approved + pending
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
      // Tab Đang hiển thị: lấy cả approved + pending
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

  // ====== Tính phí nhãn & số dư hiện tại ======
  const activeLabelCode = (labelModalPost?.labelCode || "").toUpperCase();
  const selectedLabelCode = (selectedLabel || "").toUpperCase();
  const currentSelectedMeta = LABEL_META[selectedLabelCode] || null;
  const rawLabelPrice = currentSelectedMeta?.price || 0;

  // BE chỉ trừ tiền khi:
  //  - đổi sang nhãn khác & không phải "không gắn nhãn"
  //  - còn lại (giữ nguyên nhãn, bỏ nhãn) = 0đ
  const isRemovingLabel = !selectedLabelCode;
  const isSameLabel = selectedLabelCode === activeLabelCode;
  const labelCost = isRemovingLabel || isSameLabel ? 0 : rawLabelPrice;

  const currentBalance = user?.money ?? 0;
  const canAffordLabel = currentBalance >= labelCost;

  // ====== Popup gắn nhãn ======
  const openLabelModal = (post) => {
    setLabelModalPost(post);
    setSelectedLabel(post.labelCode || ""); // giữ nhãn hiện tại
  };

  const closeLabelModal = () => {
    setLabelModalPost(null);
    setSelectedLabel("");
    setChangingLabel(false);
  };

  const handleConfirmLabel = async () => {
    if (!labelModalPost) return;
    try {
      setChangingLabel(true);

      const res = await updatePostLabel(labelModalPost.id, selectedLabel || "");
      // cập nhật số dư trong header
      if (typeof res.balance !== "undefined" && updateUser) {
        updateUser({ money: res.balance });
      }

      const newLabel = res?.data?.labelCode ?? selectedLabel ?? "";
      setPosts((prev) =>
        prev.map((p) =>
          p.id === labelModalPost.id ? { ...p, labelCode: newLabel } : p
        )
      );

      closeLabelModal();
      alert("Cập nhật nhãn thành công!");
    } catch (err) {
      if (err.code === "INSUFFICIENT_BALANCE" || err.status === 402) {
        alert("Số dư tài khoản không đủ, vui lòng nạp thêm tiền để tiếp tục.");
        closeLabelModal();
        navigate("/quan-ly/nap-tien");
      } else {
        alert(err.message || "Cập nhật nhãn thất bại");
      }
    } finally {
      setChangingLabel(false);
    }
  };

  // ====== Popup Gia hạn ======
  const openExtendModal = (post) => {
    setExtendModalPost(post);
    setExtendDays(3);
  };

  const closeExtendModal = () => {
    setExtendModalPost(null);
    setExtendDays(3);
    setExtending(false);
  };

  const extendCost = EXTEND_PRICE[extendDays] || 0;
  const canAffordExtend = currentBalance >= extendCost;

  const handleConfirmExtend = async () => {
    if (!extendModalPost || !extendDays) return;
    try {
      setExtending(true);

      const res = await extendPost(extendModalPost.id, extendDays);

      if (typeof res.balance !== "undefined" && updateUser) {
        updateUser({ money: res.balance });
      }

      const newStar =
        res?.data?.star ?? (Number(extendModalPost.star || 0) + extendDays);
      const newStatus = res?.data?.status || extendModalPost.status;
      const newCreatedAt = res?.data?.createdAt || extendModalPost.createdAt;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === extendModalPost.id
            ? {
                ...p,
                star: newStar,
                status: newStatus,
                createdAt: newCreatedAt,
              }
            : p
        )
      );

      closeExtendModal();
      alert("Gia hạn bài đăng thành công!");
    } catch (err) {
      if (err.code === "INSUFFICIENT_BALANCE" || err.status === 402) {
        alert(
          "Số dư tài khoản không đủ, vui lòng nạp thêm tiền để tiếp tục gia hạn."
        );
        closeExtendModal();
        navigate("/quan-ly/nap-tien");
      } else {
        alert(err.message || "Gia hạn tin thất bại");
      }
    } finally {
      setExtending(false);
    }
  };

  // ====== Popup ẨN TIN ======
  const openHideModal = (post) => {
    setHideModalPost(post);
  };

  const closeHideModal = () => {
    setHideModalPost(null);
    setHiding(false);
  };

  const handleConfirmHide = async () => {
    if (!hideModalPost) return;
    try {
      setHiding(true);

      const res = await hidePost(hideModalPost.id);
      const newStatus = res?.data?.status || "hidden";

      setPosts((prev) =>
        prev.map((p) =>
          p.id === hideModalPost.id ? { ...p, status: newStatus } : p
        )
      );

      closeHideModal();
      alert("Ẩn tin thành công!");
    } catch (err) {
      alert(err.message || "Ẩn tin thất bại");
    } finally {
      setHiding(false);
    }
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
              const thumbnail =
                (Array.isArray(p.images) && p.images[0]) || logoPost;

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
                        {p.labelCode && (
                          <span className="px-2 py-[2px] rounded-sm bg-gray-100 text-gray-600">
                            {p.labelCode}
                          </span>
                        )}
                      </div>

                      {/* Tiêu đề – bấm vào mở chi tiết */}
                      <Link
                        to={`/bai-dang/${p.id}`}
                        className="block text-[15px] font-semibold text-[#055699] mb-1 line-clamp-2 hover:underline cursor-pointer"
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
                  <div className="w-full md:w-[220px]">
                    <div
                      className={`border rounded-lg px-4 py-3 flex flex-col items-center text-center ${info.boxClass}`}
                    >
                      <p
                        className={`text-[15px] font-semibold mb-2 ${info.className}`}
                      >
                        {info.label}
                      </p>

                      <div className="flex flex-wrap gap-2 justify-center mb-2">
                        {p.status === "approved" || p.status === "pending" ? (
                          <>
                            <button
                              onClick={() =>
                                navigate(`/quan-ly/tin-dang/sua-tin/${p.id}`)
                              }
                              className="px-3 py-1 rounded-md bg-gray-100 text-xs text-gray-700 hover:bg-gray-200"
                            >
                              Sửa tin
                            </button>
                            <button
                              onClick={() => openLabelModal(p)}
                              className="px-3 py-1 rounded-md bg-gray-100 text-xs text-gray-700 hover:bg-gray-200"
                            >
                              Gắn nhãn
                            </button>
                            <button
                              onClick={() => openExtendModal(p)}
                              className="px-3 py-1 rounded-md bg-gray-100 text-xs text-gray-700 hover:bg-gray-200"
                            >
                              Gia hạn
                            </button>
                            <button
                              onClick={() => openHideModal(p)}
                              className="px-3 py-1 rounded-md bg-gray-100 text-xs text-gray-700 hover:bg-gray-200"
                            >
                              Ẩn tin
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              navigate(`/quan-ly/tin-dang/dang-lai/${p.id}`)
                            }
                            className="px-3 py-1 rounded-md bg-gray-100 text-xs text-gray-700 hover:bg-gray-200"
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

      {/* POPUP GẮN NHÃN */}
      <Modal
        open={!!labelModalPost}
        onClose={closeLabelModal}
        title="Gắn nhãn cho bài đăng"
        footer={
          <>
            <button
              type="button"
              onClick={closeLabelModal}
              className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              Hủy
            </button>
            {canAffordLabel ? (
              <button
                type="button"
                onClick={handleConfirmLabel}
                disabled={changingLabel}
                className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {changingLabel ? "Đang cập nhật..." : "Xác nhận"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeLabelModal();
                  navigate("/quan-ly/nap-tien");
                }}
                className="px-5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
              >
                Nạp tiền
              </button>
            )}
          </>
        }
      >
        {labelModalPost && (
          <div className="space-y-4 text-[15px]">
            <div>
              <div className="text-sm font-medium mb-1">Bài đăng</div>
              <div className="text-sm text-gray-700 line-clamp-2">
                {labelModalPost.title}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Nhãn hiện tại</div>
              {renderLabelBadge(labelModalPost.labelCode)}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Chọn nhãn mới</div>
              <div className="grid gap-2">
                {LABEL_OPTIONS.map((code) => {
                  const meta = LABEL_META[code] || null;
                  const isNone = !code;
                  const price = meta?.price || 0;
                  return (
                    <label
                      key={code || "none"}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border cursor-pointer ${
                        selectedLabel === code
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isNone ? (
                          <div className="w-10 h-6 flex items-center justify-center text-xs text-gray-500 bg-gray-100 rounded-[4px]">
                            none
                          </div>
                        ) : (
                          <img
                            src={meta.img}
                            alt={meta.name}
                            className="w-10 h-6 object-contain rounded-[4px]"
                          />
                        )}
                        <span className="text-sm">
                          {isNone ? "Không gắn nhãn" : meta.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {price ? formatVND(price) : "0đ"}
                        </span>
                        <input
                          type="radio"
                          className="accent-orange-500"
                          checked={selectedLabel === code}
                          onChange={() => setSelectedLabel(code)}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <p>
                Số dư hiện tại: <b>{formatVND(currentBalance)}</b>
              </p>
              <p>
                Phí nhãn mới: <b>{formatVND(labelCost)}</b>
              </p>
              <p>
                Số dư dự kiến còn lại:{" "}
                <b>{formatVND(currentBalance - labelCost)}</b>
              </p>
              {currentBalance < labelCost && (
                <p className="text-red-600 mt-1">
                  * Số dư hiện tại không đủ, vui lòng nạp thêm để gắn nhãn.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* POPUP GIA HẠN */}
      <Modal
        open={!!extendModalPost}
        onClose={closeExtendModal}
        title="Gia hạn hiển thị cho bài đăng"
        footer={
          <>
            <button
              type="button"
              onClick={closeExtendModal}
              className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              Hủy
            </button>
            {canAffordExtend ? (
              <button
                type="button"
                onClick={handleConfirmExtend}
                disabled={extending}
                className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {extending ? "Đang gia hạn..." : "Xác nhận gia hạn"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeExtendModal();
                  navigate("/quan-ly/nap-tien");
                }}
                className="px-5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
              >
                Nạp tiền
              </button>
            )}
          </>
        }
      >
        {extendModalPost && (
          <div className="space-y-4 text-[15px]">
            <div>
              <div className="text-sm font-medium mb-1">Bài đăng</div>
              <div className="text-sm text-gray-700 line-clamp-2">
                {extendModalPost.title}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Ngày đăng</div>
                <div className="font-medium">
                  {extendModalPost.createdAt
                    ? new Date(
                        extendModalPost.createdAt
                      ).toLocaleString("vi-VN")
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Ngày hết hạn hiện tại</div>
                <div className="font-medium">
                  {(() => {
                    const d = calcExpireDate(
                      extendModalPost.createdAt,
                      extendModalPost.star
                    );
                    return d ? d.toLocaleString("vi-VN") : "-";
                  })()}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">
                Chọn thời gian gia hạn
              </div>
              <div className="grid gap-2">
                {EXTEND_OPTIONS.map((opt) => (
                  <label
                    key={opt.days}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border cursor-pointer ${
                      extendDays === opt.days
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{opt.days} ngày</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {formatVND(opt.price)}
                      </span>
                      <input
                        type="radio"
                        className="accent-orange-500"
                        checked={extendDays === opt.days}
                        onChange={() => setExtendDays(opt.days)}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Ngày hết hạn mới (dự kiến)</div>
                <div className="font-medium">
                  {(() => {
                    const cur = calcExpireDate(
                      extendModalPost.createdAt,
                      extendModalPost.star
                    );
                    if (!cur) return "-";
                    const next = new Date(cur.getTime());
                    next.setDate(next.getDate() + Number(extendDays || 0));
                    return next.toLocaleString("vi-VN");
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <p>
                Số dư hiện tại: <b>{formatVND(currentBalance)}</b>
              </p>
              <p>
                Phí gia hạn: <b>{formatVND(extendCost)}</b>
              </p>
              <p>
                Số dư dự kiến còn lại:{" "}
                <b>{formatVND(currentBalance - extendCost)}</b>
              </p>
              {currentBalance < extendCost && (
                <p className="text-red-600 mt-1">
                  * Số dư hiện tại không đủ, vui lòng nạp thêm để gia hạn.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* POPUP ẨN TIN */}
      <Modal
        open={!!hideModalPost}
        onClose={closeHideModal}
        title="Ẩn tin đăng"
        footer={
          <>
            <button
              type="button"
              onClick={closeHideModal}
              className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmHide}
              disabled={hiding}
              className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
            >
              {hiding ? "Đang ẩn tin..." : "Xác nhận"}
            </button>
          </>
        }
      >
        {hideModalPost && (
          <div className="space-y-4 text-[15px]">
            <div>
              <div className="text-sm font-medium mb-1">Bài đăng</div>
              <div className="text-sm text-gray-700 line-clamp-2">
                {hideModalPost.title}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm space-y-1">
              <p>
                Tin này sẽ được chuyển sang trạng thái <b>ẩn (hidden)</b> và
                không còn hiển thị với người tìm phòng.
              </p>
              <p>
                Bạn vẫn có thể xem tin trong tab <b>Tin ẩn</b> và chỉnh sửa lại
                nội dung nếu cần.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
