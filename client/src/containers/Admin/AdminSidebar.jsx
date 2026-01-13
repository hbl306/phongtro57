// src/containers/Admin/AdminSidebar.jsx
import { useLocation, useNavigate } from "react-router-dom";

export const ADMIN_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
  { key: "posts", label: "Quản lý bài đăng", path: "/admin/posts" },
  {
    key: "bookings",
    label: "Quản lý phòng đặt",
    path: "/admin/bookings"
    
  },
  { key: "users", label: "Quản lý người dùng", path: "/admin/users" },
  { key: "chat", label: "Chat", path: "/admin/chat" },
];

export default function AdminSidebar({ activeKey, className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path) => {
    if (location.pathname !== path) navigate(path);
  };

  return (
    <aside className={`w-60 shrink-0 ${className}`}>
      <div className="bg-white/90 border border-orange-100/70 rounded-2xl shadow-sm p-3">
        <div className="text-xs font-semibold text-gray-400 px-2 pb-2">
          Điều hướng quản trị
        </div>

        <nav className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              activeKey === item.key ||
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");

            const base =
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer";
            const active = "bg-[#fff3ea] text-[#ff5e2e] shadow-sm";
            const normal = "text-gray-600 hover:bg-white hover:shadow-sm";

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`${base} ${isActive ? active : normal}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
