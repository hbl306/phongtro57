// src/components/FilterBar.jsx
import Chip from "../ui/Chip.jsx";

export default function FilterBar({ cities = [], onSelectCity }) {
  return (
    <div className="mt-1 mb-3">
      <div className="text-xs text-gray-500 mb-1.5">TỈNH THÀNH:</div>
      <div className="flex flex-wrap">
        {cities.map((c) => (
          <Chip key={c} label={`Phòng trọ ${c}`} onClick={() => onSelectCity?.(c)} />
        ))}
        <Chip label="Tất cả" />
      </div>
    </div>
  );
}
