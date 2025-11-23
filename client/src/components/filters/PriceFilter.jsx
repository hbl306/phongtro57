// src/components/filters/PriceFilter.jsx
import { useNavigate, useSearchParams } from "react-router-dom";

const PRICE_PRESETS = [
  { k: "0-1000000", label: "Dưới 1 triệu" },
  { k: "1000000-2000000", label: "Từ 1 - 2 triệu" },
  { k: "2000000-5000000", label: "Từ 2 - 5 triệu" },
  { k: "5000000-7000000", label: "Từ 5 - 7 triệu" },
  { k: "7000000-10000000", label: "Từ 7 - 10 triệu" },
  { k: "10000000-15000000", label: "Từ 10 - 15 triệu" },
  { k: "15000000-999999999", label: "Trên 15 triệu" },
];

const AREA_PRESETS = [
  { k: "0-20", label: "Dưới 20 m²" },
  { k: "20-30", label: "Từ 20 - 30m²" },
  { k: "30-50", label: "Từ 30 - 50m²" },
  { k: "50-70", label: "Từ 50 - 70m²" },
  { k: "70-90", label: "Từ 70 - 90m²" },
  { k: "90-9999", label: "Trên 90m²" },
];

function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        // base
        "w-full text-left px-3 py-2 rounded-lg text-[15px] transition",
        "bg-white/90 border hover:bg-white",
        // remove hard outline + soft glow
        "focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-rose-200/40",
        // states
        active
          ? "text-[#b45309] border-[#ffd7b8] bg-[#fff3e8]"
          : "text-gray-700 border-gray-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function PriceFilter() {
  const [sp] = useSearchParams();
  const current = sp.get("price");
  const navigate = useNavigate();

  const setValue = (val) => {
    const next = new URLSearchParams(sp);
    if (!val) next.delete("price");
    else next.set("price", val);
    navigate({ search: next.toString() }, { replace: true });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {PRICE_PRESETS.map((p) => (
        <Pill key={p.k} active={current === p.k} onClick={() => setValue(p.k)}>
          {p.label}
        </Pill>
      ))}
      <button
        type="button"
        onClick={() => setValue("")}
        className="col-span-2 mt-1 text-sm text-[#1e40af] hover:underline focus:outline-none focus-visible:outline-none"
      >
        Xoá lọc giá
      </button>
    </div>
  );
}

export function AreaPresetFilter() {
  const [sp] = useSearchParams();
  const current = sp.get("area");
  const navigate = useNavigate();

  const setValue = (val) => {
    const next = new URLSearchParams(sp);
    if (!val) next.delete("area");
    else next.set("area", val);
    navigate({ search: next.toString() }, { replace: true });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {AREA_PRESETS.map((p) => (
        <Pill key={p.k} active={current === p.k} onClick={() => setValue(p.k)}>
          {p.label}
        </Pill>
      ))}
      <button
        type="button"
        onClick={() => setValue("")}
        className="col-span-2 mt-1 text-sm text-[#1e40af] hover:underline focus:outline-none focus-visible:outline-none"
      >
        Xoá lọc diện tích
      </button>
    </div>
  );
}
