import { useState } from "react";
import Chip from "../ui/Chip.jsx";

const TABS = ["Đề xuất", "Mới đăng", "Có video"];

export default function CategoryTabs() {
  const [active, setActive] = useState(TABS[0]);

  return (
    <div className="flex gap-2">
      {TABS.map((t) => (
        <Chip
          key={t}
          label={t}
          active={active === t}
          onClick={() => setActive(t)}
        />
      ))}
    </div>
  );
}
