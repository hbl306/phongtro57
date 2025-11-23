// src/components/sidebar/ManageSidebar.jsx
// Sidebar khu "Quản lý" – hiển thị menu khác nhau theo vai trò user

import { NavLink } from "react-router-dom";
import { useAuth } from "../../containers/Public/AuthContext.jsx";

export default function ManageSidebar() {
  const { user } = useAuth();
  const role = Number(user?.role); // 0: Người thuê, 1: Người cho thuê, 2: Admin...

  /* ========= MENU CHUNG cho cả 2 role ========= */
  const commonMenu = [
    {
      to: "/quan-ly/nap-tien",
      label: "Nạp tiền vào tài khoản",
      icon: "💳",
    },
    {
      to: "/quan-ly/lich-su-nap",
      label: "Lịch sử nạp tiền",
      icon: "⏱",
    },
    {
      to: "/quan-ly/lich-su-thanh-toan",
      label: "Lịch sử thanh toán",
      icon: "📑",
    },
    {
      to: "/quan-ly/bang-gia",
      label: "Bảng giá dịch vụ",
      icon: "🏷",
    },
    {
      to: "/quan-ly/tai-khoan",
      label: "Quản lý tài khoản",
      icon: "👤",
    },
  ];

  /* ========= MENU TUỲ THEO VAI TRÒ ========= */
  let menu = [];

  // 👉 Người cho thuê (role = 1)
  if (role === 1) {
    menu = [
      {
        to: "/quan-ly/dang-tin-moi",
        label: "Đăng tin mới",
        icon: "📝",
      },
      {
        to: "/quan-ly/tin-dang",
        label: "Danh sách tin đăng",
        icon: "📄",
      },
      {
        // route riêng cho ROLE 1
        to: "/quan-ly/phong-duoc-dat",
        label: "Phòng được đặt cọc",
        icon: "🏠",
      },
      ...commonMenu,
    ];
  }
  // 👉 Người thuê trọ (role = 0)
  else if (role === 0) {
    menu = [
      {
        // route riêng cho ROLE 0
        to: "/quan-ly/phong-dat",
        label: "Danh sách phòng đặt cọc",
        icon: "📂",
      },
      ...commonMenu,
    ];
  }
  // 👉 Fallback (admin hoặc chưa xác định) – chỉ dùng menu chung
  else {
    menu = [...commonMenu];
  }

  return (
    <aside className="w-[250px] bg-white border-r border-gray-200 min-h-[calc(100vh-52px)]">
      {/* Bạn có thể thêm box thông tin user ở trên nếu muốn */}

      <nav className="py-3">
        {menu.map((item) => (
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
