import React, { useRef, useState, useCallback, useEffect } from "react";
import VietnamAddress from "../../components/VietnamAddress.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { useAuth } from "../Public/AuthContext.jsx";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getPostById,
  createPost,
  updatePost,
  repostPost,
} from "../../services/postService.js";

/* --------- CONSTANTS --------- */
const CATEGORY_OPTIONS = [
  { code: "PT", label: "Phòng trọ, nhà trọ" },
  { code: "NNC", label: "Nhà nguyên căn" },
  { code: "CH", label: "Căn hộ / chung cư mini" },
  { code: "OG", label: "Ở ghép" },
  { code: "MB", label: "Mặt bằng, văn phòng" },
];

const LABEL_OPTIONS = [
  { code: "", label: "-- Không gắn nhãn --" },
  { code: "HOT", label: "Nổi bật (50.000đ)" },
  { code: "VIP1", label: "Vip1 (30.000đ)" },
  { code: "VIP2", label: "Vip2 (20.000đ)" },
  { code: "VIP3", label: "Vip3 (10.000đ)" },
];

const FEATURE_LIST = [
  "Đầy đủ nội thất",
  "Có máy lạnh",
  "Có gác",
  "Có máy giặt",
  "Có thang máy",
  "Không chung chủ",
  "Giờ giấc tự do",
  "Có kệ bếp",
  "Có tủ lạnh",
  "Bảo vệ 24/24",
  "Chỗ để xe",
  "Cho nuôi pet",
];

const LABEL_COST = { HOT: 50000, VIP1: 30000, VIP2: 20000, VIP3: 10000 };
const formatVND = (n = 0) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

/* ======================================= */

export default function PostNew() {
  const areaRef = useRef(null);
  const infoRef = useRef(null);
  const imagesRef = useRef(null);
  const videoRef = useRef(null);
  const contactRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();

  const isEdit = location.pathname.includes("/tin-dang/sua-tin/");
  const isRepost = location.pathname.includes("/tin-dang/dang-lai/");

  const [form, setForm] = useState({
    categoryCode: "",
    address: {
      province: "",
      district: "",
      ward: "",
      street: "",
      fullAddress: "",
    },
    title: "",
    description: "",
    price: "",
    area: "",
    features: [],
    imagePreviews: [],
    videoPreviewUrl: "",
    imageUrls: [],
    videoUrl: "",
    contactName: "",
    contactPhone: "",
    labelCode: "",
  });

  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        contactName: p.contactName || user.name || "",
        contactPhone: p.contactPhone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!postId) return;

    (async () => {
      try {
        const data = await getPostById(postId);

        const addr = {
          province: data.province || "",
          district: data.district || "",
          ward: data.ward || "",
          street: data.street || "",
          fullAddress: data.address || "",
        };

        const images = Array.isArray(data.images) ? data.images : [];
        const videos = Array.isArray(data.videos) ? data.videos : [];
        const firstVideo = videos[0];

        let videoUrl = firstVideo?.src || data.videoUrl || "";
        let videoPreviewUrl = "";
        if (firstVideo && firstVideo.type === "file") {
          videoPreviewUrl = firstVideo.src;
        }

        setForm((prev) => ({
          ...prev,
          categoryCode: data.categoryCode || "",
          address: addr,
          title: data.title || "",
          description: data.description || "",
          price:
            typeof data.price === "number" && !Number.isNaN(data.price)
              ? String(data.price)
              : "",
          area:
            typeof data.area === "number" && !Number.isNaN(data.area)
              ? String(data.area)
              : "",
          features: Array.isArray(data.features) ? data.features : [],
          imagePreviews: images.map((img) => img.url || img),
          imageUrls: images.map((img) => img.url || img),
          videoUrl,
          videoPreviewUrl,
          contactName: data.contactName || data.contact_name || user?.name || "",
          contactPhone:
            data.contactPhone || data.contact_phone || user?.phone || "",
          labelCode: data.labelCode || "",
        }));
      } catch (err) {
        console.error(err);
        alert(err.message || "Không tải được dữ liệu bài đăng");
        navigate("/quan-ly/tin-dang");
      }
    })();
  }, [postId, navigate, user]);

  const tabs = [
    { key: "area", label: "Khu vực", ref: areaRef },
    { key: "info", label: "Thông tin mô tả", ref: infoRef },
    { key: "images", label: "Hình ảnh", ref: imagesRef },
    { key: "video", label: "Video", ref: videoRef },
    { key: "contact", label: "Liên hệ & Nhãn", ref: contactRef },
  ];

  const scrollTo = (ref) =>
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleChange = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleToggleFeature = (feature) => {
    setForm((p) => {
      const exists = p.features.includes(feature);
      return {
        ...p,
        features: exists
          ? p.features.filter((f) => f !== feature)
          : [...p.features, feature],
      };
    });
  };

  const handleAddressChange = useCallback((addr) => {
    setForm((prev) => {
      const same =
        JSON.stringify(prev.address ?? {}) === JSON.stringify(addr ?? {});
      return same ? prev : { ...prev, address: addr };
    });
  }, []);

  const getAuth = () => {
    const token = localStorage.getItem("pt_token");
    let userId = user?.id;
    if (!userId) {
      try {
        userId =
          JSON.parse(localStorage.getItem("pt_user") || "{}")?.id || null;
      } catch {}
    }
    return { token, userId };
  };

  /* ------------------ UPLOAD ẢNH / VIDEO ------------------- */

  const uploadFile = async (file, type = "image") => {
    const { token } = getAuth();
    if (!token) throw new Error("Không có token (pt_token). Đăng nhập lại.");
    const endpoint =
      type === "video"
        ? "http://localhost:5000/api/upload/video"
        : "http://localhost:5000/api/upload/image";

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!data?.success || !data?.url)
      throw new Error(data?.message || `Upload ${type} thất bại`);
    return data.url;
  };

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const previews = files.map((f) => URL.createObjectURL(f));
    setForm((p) => ({
      ...p,
      imagePreviews: [...p.imagePreviews, ...previews].slice(0, 20),
    }));

    try {
      const urls = await Promise.all(files.map((f) => uploadFile(f, "image")));
      setForm((p) => ({
        ...p,
        imageUrls: [...p.imageUrls, ...urls].slice(0, 20),
      }));
    } catch (err) {
      alert(err.message || "Upload ảnh lỗi");
    }
  };

  const removeImage = (idx) => {
    setForm((p) => {
      const imagePreviews = [...p.imagePreviews];
      imagePreviews.splice(idx, 1);
      const imageUrls = [...p.imageUrls];
      imageUrls.splice(idx, 1);
      return { ...p, imagePreviews, imageUrls };
    });
  };

  const onPickVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setForm((p) => ({ ...p, videoPreviewUrl: localUrl }));

    try {
      const url = await uploadFile(file, "video");
      setForm((p) => ({ ...p, videoUrl: url }));
    } catch (err) {
      alert(err.message || "Upload video lỗi");
    }
  };

  /* ------------------ SUBMIT FORM ------------------- */

  const doSubmitPost = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { token } = getAuth();
      if (!token) throw new Error("Thiếu token. Vui lòng đăng nhập lại.");

      const { province, district, ward, street } = form.address || {};
      const fullAddress =
        form.address?.fullAddress ||
        [street, ward, district, province].filter(Boolean).join(", ");

      const payload = {
        title: form.title,
        categoryCode: form.categoryCode,
        labelCode: form.labelCode || null,
        description: form.description,
        address: fullAddress,
        province,
        district,
        ward,
        street,
        contact_name: form.contactName,
        contact_phone: form.contactPhone,
        price: form.price ? Number(form.price) : null,
        area: form.area ? Number(form.area) : null,
        features: form.features,
        imageUrls: form.imageUrls,
        videoUrl: form.videoUrl || null,
      };

      if (isEdit) {
        await updatePost(postId, payload);
        setSuccessInfo({
          title: "Cập nhật tin thành công!",
          action: "Cập nhật nội dung tin",
          charged: 0,
          balance: user?.money ?? 0,
        });
      } else {
        // Đăng mới hoặc Đăng lại
        let data;
        if (isRepost) {
          data = await repostPost(postId, payload);
        } else {
          data = await createPost(payload);
        }

        if (typeof data.balance !== "undefined" && updateUser) {
          updateUser({ money: data.balance });
        }

        setOpenConfirm(false);

        setSuccessInfo({
          title: isRepost ? "Đăng lại tin thành công!" : "Đăng tin thành công!",
          action: isRepost ? "Đăng lại tin" : "Đăng tin mới",
          charged: data.charged ?? LABEL_COST[form.labelCode] ?? 0,
          balance:
            typeof data.balance !== "undefined"
              ? data.balance
              : user?.money ?? 0,
        });

        setForm({
          categoryCode: "",
          address: {
            province: "",
            district: "",
            ward: "",
            street: "",
            fullAddress: "",
          },
          title: "",
          description: "",
          price: "",
          area: "",
          features: [],
          imagePreviews: [],
          videoPreviewUrl: "",
          imageUrls: [],
          videoUrl: "",
          contactName: user?.name || "",
          contactPhone: user?.phone || "",
          labelCode: "",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const tryOpenConfirm = (e) => {
    e.preventDefault();
    if (isEdit) {
      doSubmitPost();
    } else {
      setOpenConfirm(true);
    }
  };

  const labelPrice = LABEL_COST[form.labelCode] || 0;
  const enoughMoney = (user?.money ?? 0) >= labelPrice;

  const titleText = isEdit
    ? "Chỉnh sửa tin đăng"
    : isRepost
    ? "Đăng lại tin đã đăng"
    : "Đăng tin cho thuê";

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-8 px-3 flex justify-center">
      <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-md">
        {/* Header form */}
        <div className="px-6 pt-6">
          <h1 className="text-2xl font-semibold mb-3">{titleText}</h1>

          <div className="flex gap-4 border-b border-gray-100 mb-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => scrollTo(t.ref)}
                className="px-1 pb-4 text-sm font-medium border-b-2 border-transparent hover:border-orange-500 hover:text-orange-500 whitespace-nowrap"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <form onSubmit={tryOpenConfirm} className="px-6 pb-8 space-y-8">
          {/* 1. LOẠI CM + ĐỊA CHỈ */}
          <section ref={areaRef} className="space-y-6 scroll-mt-28">
            <div>
              <h2 className="text-base font-semibold mb-2">Loại chuyên mục</h2>
              <div className="bg-[#fafbfc] rounded-xl p-5 ring-1 ring-gray-100">
                <select
                  value={form.categoryCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, categoryCode: e.target.value }))
                  }
                  className="w-full rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                >
                  <option value="">-- Chọn loại chuyên mục --</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">Khu vực</h2>
              <div className="bg-[#fafbfc] rounded-xl p-5 ring-1 ring-gray-100">
                <VietnamAddress
                  value={form.address}
                  onChange={handleAddressChange}
                />
              </div>
            </div>
          </section>

          {/* 2. THÔNG TIN MÔ TẢ */}
          <section ref={infoRef} className="space-y-6 scroll-mt-28">
            <h2 className="text-base font-semibold">Thông tin mô tả</h2>
            <div className="bg-[#fafbfc] rounded-xl p-5 space-y-4 ring-1 ring-gray-100">
              <input
                value={form.title}
                onChange={handleChange("title")}
                placeholder="Tiêu đề bài đăng"
                className="w-full rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                required
              />

              <textarea
                value={form.description}
                onChange={handleChange("description")}
                className="w-full h-28 rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="Mô tả chi tiết về phòng, tiện ích, giờ giấc..."
                required
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Giá cho thuê *</label>
                  <div className="flex gap-2">
                    <input
                      value={form.price}
                      onChange={handleChange("price")}
                      className="flex-1 rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      placeholder="VD: 3500000"
                      required
                    />
                    <div className="px-3 py-2 bg-white rounded-md ring-1 ring-inset ring-gray-200 text-sm">
                      đ/tháng
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Diện tích *</label>
                  <div className="flex gap-2">
                    <input
                      value={form.area}
                      onChange={handleChange("area")}
                      className="flex-1 rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      placeholder="VD: 25"
                      required
                    />
                    <div className="px-3 py-2 bg-white rounded-md ring-1 ring-inset ring-gray-200 text-sm">
                      m²
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm font-medium mb-2">Đặc điểm nổi bật</p>
              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-2 text-sm">
                {FEATURE_LIST.map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.features.includes(item)}
                      onChange={() => handleToggleFeature(item)}
                      className="accent-orange-500"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* 3. HÌNH ẢNH */}
          <section ref={imagesRef} className="space-y-4 scroll-mt-28">
            <h2 className="text-base font-semibold">Hình ảnh</h2>
            <div className="bg-[#fafbfc] rounded-xl p-5 ring-1 ring-gray-100">
              <input
                type="file"
                accept="image/*"
                multiple
                id="img-upload"
                onChange={onPickImages}
                className="hidden"
              />
              <label
                htmlFor="img-upload"
                className="border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer bg-white hover:bg-gray-50"
              >
                <span className="text-4xl">📷</span>
                <span className="text-sm text-gray-500">
                  Tải ảnh từ thiết bị (tối đa 20 ảnh)
                </span>
              </label>

              {form.imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-3">
                  {form.imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={src.url || src}
                        alt={`img-${idx}`}
                        className="w-full h-28 object-cover rounded-md ring-1 ring-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.imageUrls.length > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  Đã upload {form.imageUrls.length} ảnh.
                </p>
              )}
            </div>
          </section>

          {/* 4. VIDEO */}
          <section ref={videoRef} className="space-y-4 scroll-mt-28">
            <h2 className="text-base font-semibold">Video</h2>
            <div className="bg-[#fafbfc] rounded-xl p-5 space-y-3 ring-1 ring-gray-100">
              <label className="block text-sm font-medium">
                Link YouTube / TikTok
              </label>
              <input
                value={
                  form.videoUrl?.startsWith("/uploads/") ? "" : form.videoUrl
                }
                onChange={(e) =>
                  setForm((p) => ({ ...p, videoUrl: e.target.value }))
                }
                className="w-full rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="https://www.youtube.com/watch?v=..."
              />

              <input
                type="file"
                accept="video/*"
                id="video-upload"
                onChange={onPickVideo}
                className="hidden"
              />
              <label
                htmlFor="video-upload"
                className="border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer bg-white hover:bg-gray-50"
              >
                <span className="text-4xl">📹</span>
                <span className="text-sm text-gray-500">
                  Tải video từ thiết bị
                </span>
              </label>

              {form.videoPreviewUrl && (
                <div className="mt-3">
                  <video
                    src={form.videoPreviewUrl}
                    controls
                    className="w-full rounded-xl ring-1 ring-gray-200"
                  />
                </div>
              )}

              {form.videoUrl?.startsWith("/uploads/") && (
                <p className="text-xs text-green-600">
                  Đã upload video: {form.videoUrl}
                </p>
              )}
            </div>
          </section>

          {/* 5. LIÊN HỆ + NHÃN */}
          <section ref={contactRef} className="space-y-6 scroll-mt-28">
            <div>
              <h2 className="text-base font-semibold">Thông tin liên hệ</h2>
              <div className="bg-[#fafbfc] rounded-xl p-5 space-y-4 ring-1 ring-gray-100">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    value={form.contactName}
                    onChange={handleChange("contactName")}
                    placeholder="Họ tên người liên hệ"
                    className="rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <input
                    value={form.contactPhone}
                    onChange={handleChange("contactPhone")}
                    placeholder="Số điện thoại"
                    className="rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold">Nhãn bài đăng</h2>
              <div className="bg-[#fafbfc] rounded-xl p-5 ring-1 ring-gray-100">
                <select
                  value={form.labelCode}
                  onChange={handleChange("labelCode")}
                  disabled={isEdit}
                  className="w-full rounded-md px-3 py-2 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-100"
                >
                  {LABEL_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                {!isEdit && !!labelPrice && (
                  <p className="mt-2 text-sm text-gray-600">
                    Phí dự kiến:{" "}
                    <span className="font-medium text-gray-900">
                      {formatVND(labelPrice)}
                    </span>
                  </p>
                )}
                {isEdit && (
                  <p className="mt-2 text-xs text-gray-500">
                    Nhãn đã chọn sẽ được giữ nguyên khi chỉnh sửa, hệ thống không
                    trừ tiền thêm.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-10 py-3 rounded-full font-medium"
            >
              {submitting
                ? isEdit
                  ? "Đang cập nhật..."
                  : isRepost
                  ? "Đang đăng lại..."
                  : "Đang đăng..."
                : isEdit
                ? "Cập nhật tin"
                : isRepost
                ? "Đăng lại tin"
                : "Đăng tin"}
            </button>
          </div>
        </form>
      </div>

      {/* POPUP XÁC NHẬN (đăng mới + đăng lại) */}
      <Modal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title="Xác nhận đăng tin"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpenConfirm(false)}
              className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              Hủy
            </button>

            {enoughMoney ? (
              <button
                type="button"
                onClick={doSubmitPost}
                disabled={submitting}
                className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {submitting ? "Đang đăng..." : "Xác nhận"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/quan-ly/nap-tien")}
                className="px-5 py-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Nạp tiền
              </button>
            )}
          </>
        }
      >
        <div className="space-y-2 text-[15px]">
          <p>
            Nhãn chọn:{" "}
            <b>
              {form.labelCode
                ? LABEL_OPTIONS.find((l) => l.code === form.labelCode)?.label?.replace(
                    /\s*\(\d.*\)$/,
                    ""
                  )
                : "Không gắn nhãn"}
            </b>
          </p>

          <p>
            Phí cần: <b>{formatVND(labelPrice)}</b>
          </p>

          <p>
            Số dư hiện có: <b>{formatVND(user?.money ?? 0)}</b>
          </p>

          {!enoughMoney && (
            <p className="text-red-600">
              Số dư hiện tại không đủ. Vui lòng nạp tiền để tiếp tục.
            </p>
          )}
        </div>
      </Modal>

      {/* POPUP THÀNH CÔNG */}
      <Modal
        open={!!successInfo}
        onClose={() => setSuccessInfo(null)}
        title={successInfo?.title || "Thành công"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSuccessInfo(null)}
              className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              Ở lại trang
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessInfo(null);
                navigate("/quan-ly/tin-dang");
              }}
              className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600"
            >
              Về quản lý tin
            </button>
          </>
        }
      >
        {successInfo && (
          <div className="space-y-2 text-[15px]">
           
            <p>
              Thành công!
            </p>
           
          </div>
        )}
      </Modal>
    </div>
  );
}
