import { NavLink } from "react-router-dom";
import { useAuth } from "../../containers/Public/AuthContext.jsx";

export default function ManageSidebar() {
  const { user } = useAuth();

  const menu = [
    { to: "/quan-ly/dang-tin-moi", label: "Đăng tin mới", icon: "📝" },
    { to: "/quan-ly/tin-dang", label: "Danh sách tin đăng", icon: "📄" },
    { to: "/quan-ly/nap-tien", label: "Nạp tiền vào tài khoản", icon: "💳" },
    { to: "/quan-ly/lich-su-nap", label: "Lịch sử nạp tiền", icon: "⏱" },
    { to: "/quan-ly/lich-su-thanh-toan", label: "Lịch sử thanh toán", icon: "📑" },
    { to: "/quan-ly/bang-gia", label: "Bảng giá dịch vụ", icon: "🏷" },
    { to: "/quan-ly/tai-khoan", label: "Quản lý tài khoản", icon: "👤" },
  ];

  return (
    <aside className="w-[250px] bg-white border-r border-gray-200 min-h-[calc(100vh-52px)]">
      {/* user box ... */}
      <nav className="py-3">
        {menu.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-5 py-2.5 text-left text-[15px] ${
                isActive
                  ? "bg-[#e8f1ff] text-[#003773] font-medium border-r-4 border-[#003773]"
                  : "text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
