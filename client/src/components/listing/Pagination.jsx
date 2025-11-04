// src/components/Pagination.jsx
export default function Pagination({ page = 1, total = 10, onChange }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1).slice(0, 6);
  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      <button
        onClick={() => onChange?.(Math.max(1, page - 1))}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
      >
        Trước
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange?.(p)}
          className={`w-9 h-9 rounded-lg border text-sm ${
            p === page ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange?.(Math.min(total, page + 1))}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
      >
        Sau
      </button>
    </div>
  );
}
