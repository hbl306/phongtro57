// src/components/listing/Pagination.jsx
import React from "react";

/**
 * Props:
 * - page: trang hiện tại (1-based)
 * - pageCount: tổng số trang
 * - onPageChange: (nextPage: number) => void
 */
export default function Pagination({ page = 1, pageCount = 1, onPageChange }) {
  // Nếu chỉ có 0 hoặc 1 trang thì không cần hiện phân trang
  if (!pageCount || pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const goto = (p) => {
    if (!onPageChange) return;
    if (p < 1 || p > pageCount || p === page) return;
    onPageChange(p);
  };

  return (
    <nav className="mt-6 flex items-center justify-center gap-2 select-none">
      {/* Nút về trang trước */}
      <button
        type="button"
        onClick={() => goto(page - 1)}
        disabled={page <= 1}
        className={`px-3 h-9 rounded-full border text-sm flex items-center justify-center ${
          page <= 1
            ? "border-gray-200 text-gray-300 cursor-default"
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        ‹
      </button>

      {/* Các nút số trang */}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => goto(p)}
          className={`w-9 h-9 rounded-full border text-sm flex items-center justify-center ${
            p === page
              ? "bg-[#ff5e2e] border-[#ff5e2e] text-white font-semibold"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}

      {/* Nút sang trang sau */}
      <button
        type="button"
        onClick={() => goto(page + 1)}
        disabled={page >= pageCount}
        className={`px-3 h-9 rounded-full border text-sm flex items-center justify-center ${
          page >= pageCount
            ? "border-gray-200 text-gray-300 cursor-default"
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        ›
      </button>
    </nav>
  );
}
