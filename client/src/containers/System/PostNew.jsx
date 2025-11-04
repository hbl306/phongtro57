// src/containers/System/PostNew.jsx
import React, { useRef } from "react";

export default function PostNew() {
  // tạo ref cho từng khối
  const areaRef = useRef(null);
  const infoRef = useRef(null);
  const imagesRef = useRef(null);
  const videoRef = useRef(null);
  const contactRef = useRef(null);

  const tabs = [
    { key: "area", label: "Khu vực", ref: areaRef },
    { key: "info", label: "Thông tin mô tả", ref: infoRef },
    { key: "images", label: "Hình ảnh", ref: imagesRef },
    { key: "video", label: "Video", ref: videoRef },
    { key: "contact", label: "Thông tin liên hệ", ref: contactRef },
  ];

  const scrollTo = (r) => {
    if (!r?.current) return;
    r.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Đăng tin cho thuê</h1>

      {/* thanh tabs điều hướng */}
      <div className="flex gap-4 border-b mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => scrollTo(t.ref)}
            className="px-3 py-3 text-sm font-medium border-b-2 border-transparent hover:border-orange-500 hover:text-orange-500 whitespace-nowrap"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Khu vực */}
      <section ref={areaRef} className="mb-8">
        <AreaSection />
      </section>

      {/* 2. Thông tin mô tả */}
      <section ref={infoRef} className="mb-8">
        <InfoSection />
      </section>

      {/* 3. Hình ảnh */}
      <section ref={imagesRef} className="mb-8">
        <ImagesSection />
      </section>

      {/* 4. Video */}
      <section ref={videoRef} className="mb-8">
        <VideoSection />
      </section>

      {/* 5. Thông tin liên hệ */}
      <section ref={contactRef} className="mb-8">
        <ContactSection />
      </section>

      {/* nút gửi bài (demo) */}
      <div className="mt-6">
        <button className="bg-orange-500 text-white px-6 py-2 rounded-full font-medium">
          Đăng tin
        </button>
      </div>
    </div>
  );
}

/* ------------ SECTION 1: Khu vực ------------ */
function AreaSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 space-y-6">
      <h2 className="text-base font-semibold mb-2">Khu vực</h2>

      <div>
        <label className="block mb-1 text-sm font-medium">Loại chuyên mục *</label>
        <select className="w-full border rounded-md px-3 py-2">
          <option>-- Chọn loại chuyên mục --</option>
          <option>Phòng trọ, nhà trọ</option>
          <option>Nhà nguyên căn</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Tỉnh/Thành phố *</label>
          <select className="w-full border rounded-md px-3 py-2">
            <option>-- Chọn Tỉnh/TP --</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Quận/Huyện *</label>
          <select className="w-full border rounded-md px-3 py-2">
            <option>-- Chọn quận huyện --</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Phường/Xã</label>
          <select className="w-full border rounded-md px-3 py-2">
            <option>-- Chọn phường xã --</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Đường/Phố</label>
          <select className="w-full border rounded-md px-3 py-2">
            <option>-- Chọn đường phố --</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Số nhà</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="Nhập số nhà" />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Địa chỉ</label>
        <input className="w-full border rounded-md px-3 py-2" placeholder="Địa chỉ cụ thể" />
      </div>
    </div>
  );
}

/* ------------ SECTION 2: Thông tin mô tả ------------ */
function InfoSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 space-y-6">
      <h2 className="text-base font-semibold mb-2">Thông tin mô tả</h2>

      <div>
        <label className="block mb-1 text-sm font-medium">Tiêu đề *</label>
        <input className="w-full border rounded-md px-3 py-2" placeholder="Tiêu đề bài đăng" />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Nội dung mô tả *</label>
        <textarea
          className="w-full border rounded-md px-3 py-2 h-32"
          placeholder="Mô tả chi tiết về phòng, diện tích, tiện ích, giờ giấc..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Giá cho thuê *</label>
          <div className="flex gap-2">
            <input className="flex-1 border rounded-md px-3 py-2" placeholder="Ví dụ: 3000000" />
            <select className="border rounded-md px-3 py-2">
              <option>đồng/tháng</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Diện tích *</label>
          <div className="flex gap-2">
            <input className="flex-1 border rounded-md px-3 py-2" placeholder="Ví dụ: 25" />
            <div className="border rounded-md px-3 py-2 bg-gray-50">m²</div>
          </div>
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Đặc điểm nổi bật</label>
        <div className="grid grid-cols-4 gap-2 text-sm">
          {["Đầy đủ nội thất", "Có gác", "Có máy lạnh", "Không chung chủ", "Giờ giấc tự do"].map(
            (item) => (
              <label key={item} className="flex items-center gap-2">
                <input type="checkbox" />
                {item}
              </label>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------ SECTION 3: Hình ảnh ------------ */
function ImagesSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5">
      <h2 className="text-base font-semibold mb-2">Hình ảnh</h2>
      <p className="text-xs text-gray-500 mb-4">
        Tải lên tối đa 20 ảnh, dung lượng mỗi ảnh tối đa 10MB. Hình ảnh phải liên quan đến bài đăng.
      </p>
      <div className="border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center text-gray-400 gap-2">
        <span className="text-3xl">📷</span>
        <span>Chọn ảnh từ thiết bị</span>
      </div>
    </div>
  );
}

/* ------------ SECTION 4: Video ------------ */
function VideoSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 space-y-3">
      <h2 className="text-base font-semibold mb-2">Video</h2>
      <label className="block text-sm font-medium">Link video (Youtube/TikTok)</label>
      <input
        className="w-full border rounded-md px-3 py-2"
        placeholder="https://www.youtube.com/watch?v=..."
      />
      <p className="text-xs text-gray-500">
        Bạn có thể chọn video từ Youtube hoặc TikTok để hiển thị.
      </p>
    </div>
  );
}

/* ------------ SECTION 5: Thông tin liên hệ ------------ */
function ContactSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
      <h2 className="text-base font-semibold mb-2">Thông tin liên hệ</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Họ tên</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="Tên của bạn" />
        </div>
        <div>
          <label className="block text-sm font-medium">Số điện thoại</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="SĐT liên hệ" />
        </div>
      </div>
    </div>
  );
}
