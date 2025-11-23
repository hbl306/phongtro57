import React, { useState, useMemo, useEffect } from "react";
import provincesData from "../data/vietnam-provinces.json";

/**
 * props:
 *  - value: { province, district, ward, street, fullAddress } (optional)
 *  - onChange(addr) => void
 */
export default function VietnamAddress({ value, onChange }) {
  // local state
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [street, setStreet] = useState("");

  // ✅ Khi value từ ngoài đổi (prefill khi sửa / đăng lại)
  useEffect(() => {
    if (!value) return;

    const nextProvince = value.province || "";
    const nextDistrict = value.district || "";
    const nextWard = value.ward || "";
    const nextStreet = value.street || "";

    setProvince((prev) => (prev === nextProvince ? prev : nextProvince));
    setDistrict((prev) => (prev === nextDistrict ? prev : nextDistrict));
    setWard((prev) => (prev === nextWard ? prev : nextWard));
    setStreet((prev) => (prev === nextStreet ? prev : nextStreet));
  }, [value]);

  // lấy list quận theo tỉnh
  const districts = useMemo(() => {
    const p = provincesData.find((p) => p.name === province);
    return p ? p.districts || [] : [];
  }, [province]);

  // lấy list phường theo quận
  const wards = useMemo(() => {
    const d = districts.find((d) => d.name === district);
    return d ? d.wards || [] : [];
  }, [districts, district]);

  // địa chỉ đầy đủ
  const fullAddress = useMemo(() => {
    return [street, ward, district, province].filter(Boolean).join(", ");
  }, [street, ward, district, province]);

  // bắn ra ngoài nếu cần
  useEffect(() => {
    onChange &&
      onChange({
        province,
        district,
        ward,
        street,
        fullAddress,
      });
  }, [province, district, ward, street, fullAddress, onChange]);

  // url map
  const mapSrc = fullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        fullAddress
      )}&output=embed`
    : null;

  const inputBaseClass =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none " +
    "focus:border-orange-400 focus:ring-2 focus:ring-orange-100 " +
    "transition-colors duration-150 ease-out";
  const selectDisabled =
    "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed";

  return (
    <div className="space-y-5 bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
      {/* dòng 1: tỉnh / quận */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tỉnh/Thành phố <span className="text-red-500">*</span>
          </label>
          <select
            value={province}
            onChange={(e) => {
              const v = e.target.value;
              setProvince(v);
              setDistrict("");
              setWard("");
            }}
            className={`${inputBaseClass} ${selectDisabled}`}
          >
            <option value="">-- Chọn Tỉnh/TP --</option>
            {provincesData.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Quận/Huyện <span className="text-red-500">*</span>
          </label>
          <select
            value={district}
            onChange={(e) => {
              const v = e.target.value;
              setDistrict(v);
              setWard("");
            }}
            disabled={!province}
            className={`${inputBaseClass} ${selectDisabled}`}
          >
            <option value="">-- Chọn quận huyện --</option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* dòng 2: phường + số nhà */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Phường/Xã
          </label>
          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            disabled={!district}
            className={`${inputBaseClass} ${selectDisabled}`}
          >
            <option value="">-- Chọn phường xã --</option>
            {wards.map((w) => (
              <option key={w.name} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Địa chỉ / số nhà
          </label>
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={inputBaseClass}
            placeholder="Số nhà, tên đường..."
          />
        </div>
      </div>

      {/* bản đồ */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Bản đồ
        </label>
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 min-h-[180px]">
          {mapSrc ? (
            <iframe
              title="Google map"
              src={mapSrc}
              width="100%"
              height="280"
              style={{ border: "none" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
              Chọn địa chỉ để hiển thị bản đồ
            </div>
          )}
        </div>
        {fullAddress && (
          <p className="mt-2 text-xs text-gray-500">
            Địa chỉ đang xem: {fullAddress}
          </p>
        )}
      </div>
    </div>
  );
}
