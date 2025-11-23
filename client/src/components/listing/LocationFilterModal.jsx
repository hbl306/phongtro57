// src/components/listing/LocationFilterModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import provincesData from "../../data/vietnam-provinces.json";

/**
 * Modal "Tìm theo khu vực"
 * - Level 1: Tỉnh / Thành phố
 * - Level 2: Quận / Huyện
 * - Level 3: Phường / Xã
 *
 * Quy tắc lọc:
 * - Toàn quốc: xoá provinceName, district, ward
 * - Tất cả (level quận): lọc theo TỈNH, xoá district, ward
 * - Tất cả (level phường): lọc theo TỈNH + QUẬN, xoá ward
 * - Chọn 1 phường: lọc theo TỈNH + QUẬN + PHƯỜNG
 */

function LocationFilterModal({ open, onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [level, setLevel] = useState("province"); // "province" | "district" | "ward"
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // trạng thái hiện tại trên URL
  const activeProvinceName = searchParams.get("provinceName");
  const activeDistrictName = searchParams.get("district");
  const activeWardName = searchParams.get("ward");

  // Khi mở popup, sync lại state theo URL
  useEffect(() => {
    if (!open) return;

    const pName = searchParams.get("provinceName");
    const dName = searchParams.get("district");
    const wName = searchParams.get("ward");

    const p = provincesData.find((p) => p.name === pName) || null;
    const d = p?.districts?.find((d) => d.name === dName) || null;

    setSelectedProvince(p);
    setSelectedDistrict(d);

    if (wName && d) setLevel("ward");
    else if (dName && p) setLevel("district");
    else setLevel("province");
  }, [open, searchParams]);

  const districts = useMemo(
    () => selectedProvince?.districts || [],
    [selectedProvince]
  );
  const wards = useMemo(
    () => selectedDistrict?.wards || [],
    [selectedDistrict]
  );

  // Ghi filter xuống URL
  const applyFilter = (provinceName, districtName, wardName) => {
    const next = new URLSearchParams(searchParams);

    if (provinceName) next.set("provinceName", provinceName);
    else next.delete("provinceName");

    if (districtName) next.set("district", districtName);
    else next.delete("district");

    if (wardName) next.set("ward", wardName);
    else next.delete("ward");

    setSearchParams(next, { replace: true });
    onClose && onClose();
  };

  if (!open) return null;

  const isNationwide =
    !activeProvinceName && !activeDistrictName && !activeWardName;

  // Ô tick vuông giống phongtro123
  const SquareCheck = ({ active }) => (
    <span
      className={`mr-3 w-4 h-4 border rounded-[3px] flex items-center justify-center text-[11px] transition
      ${
        active
          ? "border-[#ff5e2e] text-[#ff5e2e] bg-[#fff7f3]"
          : "border-gray-400 text-transparent bg-white"
      }`}
    >
      ✓
    </span>
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-center items-start bg-black/30">
      <div className="mt-20 w-full max-w-[680px] max-h-[80vh] bg-white rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="font-semibold text-[17px] text-gray-900">
            {level === "province" && "Tìm theo khu vực"}
            {level === "district" &&
              (selectedProvince?.name || "Chọn tỉnh / thành")}
            {level === "ward" &&
              (selectedDistrict?.name || "Chọn quận / huyện")}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* LEVEL 1: TỈNH / THÀNH */}
          {level === "province" && (
            <div className="divide-y">
              {/* Toàn quốc */}
              <button
                className="w-full flex items-center px-6 py-3 text-sm hover:bg-gray-50 transition"
                onClick={() => applyFilter(null, null, null)}
              >
                <SquareCheck active={isNationwide} />
                <span
                  className={
                    isNationwide ? "text-[#ff5e2e] font-medium" : "text-gray-800"
                  }
                >
                  Toàn quốc
                </span>
              </button>

              {provincesData.map((p) => {
                const active = activeProvinceName === p.name;
                return (
                  <button
                    key={p.name}
                    className="w-full flex items-center justify-between px-6 py-3 text-sm hover:bg-gray-50 transition"
                    onClick={() => {
                      setSelectedProvince(p);
                      setSelectedDistrict(null);
                      setLevel("district");
                    }}
                  >
                    <div className="flex items-center">
                      <SquareCheck active={active} />
                      <span
                        className={
                          active
                            ? "text-[#ff5e2e] font-medium"
                            : "text-gray-800"
                        }
                      >
                        {p.name}
                      </span>
                    </div>
                    <span className="text-gray-400 text-lg">›</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* LEVEL 2: QUẬN / HUYỆN */}
          {level === "district" && (
            <div className="divide-y">
              {/* Tất cả -> lọc theo TỈNH */}
              {selectedProvince && (
                <button
                  className="w-full flex items-center px-6 py-3 text-sm hover:bg-gray-50 transition"
                  onClick={() =>
                    applyFilter(selectedProvince?.name || null, null, null)
                  }
                >
                  <SquareCheck
                    active={
                      activeProvinceName === selectedProvince?.name &&
                      !activeDistrictName &&
                      !activeWardName
                    }
                  />
                  <span
                    className={
                      activeProvinceName === selectedProvince?.name &&
                      !activeDistrictName &&
                      !activeWardName
                        ? "text-[#ff5e2e] font-medium"
                        : "text-gray-800"
                    }
                  >
                    Tất cả {selectedProvince?.name}
                  </span>
                </button>
              )}

              {districts.map((d) => {
                const active = activeDistrictName === d.name;
                return (
                  <button
                    key={d.name}
                    className="w-full flex items-center justify-between px-6 py-3 text-sm hover:bg-gray-50 transition"
                    onClick={() => {
                      setSelectedDistrict(d);
                      setLevel("ward");
                    }}
                  >
                    <div className="flex items-center">
                      <SquareCheck active={active} />
                      <span
                        className={
                          active
                            ? "text-[#ff5e2e] font-medium"
                            : "text-gray-800"
                        }
                      >
                        {d.name}
                      </span>
                    </div>
                    <span className="text-gray-400 text-lg">›</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* LEVEL 3: PHƯỜNG / XÃ */}
          {level === "ward" && (
            <div className="divide-y">
              {/* Tất cả -> lọc theo TỈNH + QUẬN */}
              {selectedProvince && selectedDistrict && (
                <button
                  className="w-full flex items-center px-6 py-3 text-sm hover:bg-gray-50 transition"
                  onClick={() =>
                    applyFilter(
                      selectedProvince?.name || null,
                      selectedDistrict?.name || null,
                      null
                    )
                  }
                >
                  <SquareCheck
                    active={
                      activeProvinceName === selectedProvince?.name &&
                      activeDistrictName === selectedDistrict?.name &&
                      !activeWardName
                    }
                  />
                  <span
                    className={
                      activeProvinceName === selectedProvince?.name &&
                      activeDistrictName === selectedDistrict?.name &&
                      !activeWardName
                        ? "text-[#ff5e2e] font-medium"
                        : "text-gray-800"
                    }
                  >
                    Tất cả {selectedDistrict?.name}
                  </span>
                </button>
              )}

              {wards.map((w) => {
                const active = activeWardName === w.name;
                return (
                  <button
                    key={w.name}
                    className="w-full flex items-center px-6 py-3 text-sm hover:bg-gray-50 transition"
                    onClick={() =>
                      applyFilter(
                        selectedProvince?.name || null,
                        selectedDistrict?.name || null,
                        w.name
                      )
                    }
                  >
                    <SquareCheck active={active} />
                    <span
                      className={
                        active
                          ? "text-[#ff5e2e] font-medium"
                          : "text-gray-800"
                      }
                    >
                      {w.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER: Quay lại */}
        {level !== "province" && (
          <div className="px-6 py-3 border-t bg-gray-50 text-sm">
            <button
              onClick={() => {
                if (level === "ward") setLevel("district");
                else if (level === "district") setLevel("province");
              }}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-lg leading-none">←</span>
              <span>Quay lại</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationFilterModal;
