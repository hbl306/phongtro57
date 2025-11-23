// src/components/listing/FilterModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import provincesData from "../../data/vietnam-provinces.json";

/* ---------------------------------------------
 * 1. Các cấu hình OPTION dùng chung cho bộ lọc
 * -------------------------------------------*/

// Danh mục cho thuê (code phải trùng categoryCode trong DB)
const CATEGORY_OPTIONS = [
  { code: "", label: "Tất cả" },
  { code: "PT", label: "Phòng trọ, nhà trọ" },
  { code: "NNC", label: "Nhà nguyên căn" },
  { code: "CH", label: "Căn hộ / chung cư mini" },
  { code: "OG", label: "Ở ghép" },
  { code: "MB", label: "Mặt bằng, văn phòng" },
];

// Các option khoảng giá (giá trị phải trùng format với PriceFilter: "min-max")
const PRICE_OPTIONS = [
  { id: "all", label: "Tất cả", value: "" },
  { id: "lt1", label: "Dưới 1 triệu", value: "0-1000000" },
  { id: "1-2", label: "Từ 1 - 2 triệu", value: "1000000-2000000" },
  { id: "2-3", label: "Từ 2 - 3 triệu", value: "2000000-3000000" },
  { id: "3-5", label: "Từ 3 - 5 triệu", value: "3000000-5000000" },
  { id: "5-7", label: "Từ 5 - 7 triệu", value: "5000000-7000000" },
  { id: "7-10", label: "Từ 7 - 10 triệu", value: "7000000-10000000" },
  { id: "10-15", label: "Từ 10 - 15 triệu", value: "10000000-15000000" },
  { id: "gt15", label: "Trên 15 triệu", value: "15000000-" },
];

// Các option diện tích (giống AreaPresetFilter: "min-max")
const AREA_OPTIONS = [
  { id: "all", label: "Tất cả", value: "" },
  { id: "lt20", label: "Dưới 20 m²", value: "0-20" },
  { id: "20-30", label: "Từ 20 - 30m²", value: "20-30" },
  { id: "30-50", label: "Từ 30 - 50m²", value: "30-50" },
  { id: "50-70", label: "Từ 50 - 70m²", value: "50-70" },
  { id: "70-90", label: "Từ 70 - 90m²", value: "70-90" },
  { id: "gt90", label: "Trên 90m²", value: "90-" },
];

// Đặc điểm nổi bật – id = chính là text tiếng Việt bạn lưu trong DB (mảng features)
const FEATURE_OPTIONS = [
  { id: "Đầy đủ nội thất", label: "Đầy đủ nội thất" },
  { id: "Có máy giặt", label: "Có máy giặt" },
  { id: "Giờ giấc tự do", label: "Giờ giấc tự do" },
  { id: "Bảo vệ 24/24", label: "Bảo vệ 24/24" },
  { id: "Có máy lạnh", label: "Có máy lạnh" },
  { id: "Có thang máy", label: "Có thang máy" },
  { id: "Có kệ bếp", label: "Có kệ bếp" },
  { id: "Chỗ để xe", label: "Chỗ để xe" },
  { id: "Có gác", label: "Có gác" },
  { id: "Không chung chủ", label: "Không chung chủ" },
  { id: "Có tủ lạnh", label: "Có tủ lạnh" },
  { id: "Cho nuôi pet", label: "Cho nuôi pet" },
];

/* ---------------------------------------------
 * 2. Component chính FilterModal
 * -------------------------------------------*/
function FilterModal({ open, onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- State local cho từng nhóm filter ----
  const [categoryValue, setCategoryValue] = useState(""); // code danh mục
  const [provinceName, setProvinceName] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [areaValue, setAreaValue] = useState("");
  const [featureIds, setFeatureIds] = useState([]); // mảng id feature đang chọn

  /* ------------------------------------------------
   * 2.1. Khi mở popup: sync state từ URL hiện tại
   *     (đảm bảo mở lại popup vẫn thấy đúng filter)
   * ----------------------------------------------*/
  useEffect(() => {
    if (!open) return;

    const ct = searchParams.get("category") || "";
    const pv = searchParams.get("provinceName") || "";
    const d = searchParams.get("district") || "";
    const w = searchParams.get("ward") || "";
    const pr = searchParams.get("price") || "";
    const ar = searchParams.get("area") || "";
    const ft =
      (searchParams.get("features") || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean) || [];

    setCategoryValue(ct);
    setProvinceName(pv);
    setDistrict(d);
    setWard(w);
    setPriceValue(pr);
    setAreaValue(ar);
    setFeatureIds(ft);
  }, [open, searchParams]);

  /* ------------------------------------------------
   * 2.2. Lấy danh sách quận & phường dựa trên tỉnh đã chọn
   * ----------------------------------------------*/
  const currentProvince = useMemo(
    () => provincesData.find((p) => p.name === provinceName) || null,
    [provinceName]
  );
  const districts = currentProvince?.districts || [];

  const currentDistrict = useMemo(
    () => districts.find((d) => d.name === district) || null,
    [districts, district]
  );
  const wards = currentDistrict?.wards || [];

  /* ------------------------------------------------
   * 2.3. Bật/tắt 1 feature trong mảng featureIds
   * ----------------------------------------------*/
  const toggleFeature = (id) => {
    setFeatureIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ------------------------------------------------
   * 2.4. Áp dụng bộ lọc:
   *  - Ghi toàn bộ state xuống query string (URL)
   *  - HomeShell sẽ đọc từ URL để gọi API listPosts
   * ----------------------------------------------*/
  const apply = () => {
    const next = new URLSearchParams(searchParams);

    // Danh mục
    categoryValue
      ? next.set("category", categoryValue)
      : next.delete("category");

    // Khu vực
    provinceName
      ? next.set("provinceName", provinceName)
      : next.delete("provinceName");

    district ? next.set("district", district) : next.delete("district");
    ward ? next.set("ward", ward) : next.delete("ward");

    // Giá
    priceValue ? next.set("price", priceValue) : next.delete("price");

    // Diện tích
    areaValue ? next.set("area", areaValue) : next.delete("area");

    // Đặc điểm nổi bật (mảng → chuỗi "a,b,c")
    if (featureIds.length) {
      next.set("features", featureIds.join(","));
    } else {
      next.delete("features");
    }

    setSearchParams(next, { replace: true });
    onClose && onClose();
  };

  /* ------------------------------------------------
   * 2.5. Xoá toàn bộ filter:
   *  - Reset state
   *  - Xoá các param liên quan trong URL
   * ----------------------------------------------*/
  const resetAll = () => {
    setCategoryValue("");
    setProvinceName("");
    setDistrict("");
    setWard("");
    setPriceValue("");
    setAreaValue("");
    setFeatureIds([]);

    const next = new URLSearchParams(searchParams);
    [
      "category",
      "provinceName",
      "district",
      "ward",
      "price",
      "area",
      "features",
    ].forEach((k) => next.delete(k));

    setSearchParams(next, { replace: true });
    onClose && onClose();
  };

  if (!open) return null;

  /* ---------------------------------------------
   * 3. JSX hiển thị popup bộ lọc
   * -------------------------------------------*/
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">Bộ lọc</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 3.1. Danh mục cho thuê */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Danh mục cho thuê</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.code || "all"}
                  type="button"
                  onClick={() => setCategoryValue(cat.code)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    categoryValue === cat.code
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* 3.2. Lọc theo khu vực */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Lọc theo khu vực</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tỉnh thành */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Tỉnh thành
                </label>
                <select
                  value={provinceName}
                  onChange={(e) => {
                    setProvinceName(e.target.value);
                    setDistrict("");
                    setWard("");
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  <option value="">Toàn quốc</option>
                  {provincesData.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quận huyện */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Quận huyện
                </label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setWard("");
                  }}
                  disabled={!provinceName}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  <option value="">Tất cả</option>
                  {districts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phường xã */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Phường xã
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  disabled={!district}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  <option value="">Tất cả</option>
                  {wards.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 3.3. Khoảng giá */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Khoảng giá</h3>
            <div className="flex flex-wrap gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPriceValue(opt.value)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    priceValue === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* 3.4. Khoảng diện tích */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Khoảng diện tích</h3>
            <div className="flex flex-wrap gap-2">
              {AREA_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAreaValue(opt.value)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    areaValue === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* 3.5. Đặc điểm nổi bật */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Đặc điểm nổi bật</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-sm">
              {FEATURE_OPTIONS.map((f) => {
                const checked = featureIds.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className="inline-flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      checked={checked}
                      onChange={() => toggleFeature(f.id)}
                    />
                    <span>{f.label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t flex justify-between gap-3">
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Xoá tất cả
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex-1 max-w-xs px-4 py-2 rounded-full bg-[#ff5e2e] text-white text-sm font-semibold hover:bg-[#ff4a10]"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
