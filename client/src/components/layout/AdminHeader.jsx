// src/components/layout/AdminHeader.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../containers/Public/AuthContext.jsx";

const ROLE_TEXT = {
  0: "Người thuê trọ",
  1: "Người cho thuê",
  2: "Quản trị viên",
};

const formatVND = (n = 0) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const [openUserBox, setOpenUserBox] = useState(false);
  const userBoxRef = useRef(null);
  const navigate = useNavigate();

  const roleNumber = Number(user?.role);
  const roleLabel = ROLE_TEXT?.[roleNumber] || "Người dùng";

  useEffect(() => {
    const onDown = (e) => {
      if (userBoxRef.current && !userBoxRef.current.contains(e.target)) {
        setOpenUserBox(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleLogout = () => {
    logout();
    setOpenUserBox(false);
    navigate("/");
  };

  if (!user) return null; // lý thuyết: admin route luôn có user rồi

  return (
    <>
      <header className="w-full bg-white sticky top-0 z-30 shadow-[0_1px_0_#eef]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between py-3 px-4">
          {/* Logo – về trang admin */}
          <Link to="/admin" className="flex items-center gap-2">
            <div className="text-[20px] font-bold text-[#0066cc] leading-none">
              PHONGTRO<span className="text-orange-500">57</span>.COM
            </div>
            <p className="text-xs text-gray-500">
              Kênh thông tin phòng trọ số 1 Việt Nam
            </p>
          </Link>

          {/* Khu cá nhân admin */}
          <div
            className="flex items-center gap-3 text-sm relative"
            ref={userBoxRef}
          >
            <button
              onClick={() => setOpenUserBox((p) => !p)}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="flex flex-col items-start">
                <span className="max-w-[140px] truncate font-medium">
                  {user.name}
                </span>
                <span className="text-[11px] text-gray-500">
                  {roleLabel}
                </span>
              </div>
              <span className="text-xs">▾</span>
            </button>

            {/* Popup tài khoản admin */}
            {openUserBox && (
              <div className="absolute right-0 top-[110%] w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Thông tin */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold leading-tight">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.phone}
                      </div>

                      {/* Vai trò */}
                      <div className="mt-2">
                        <div className="text-[11px] text-gray-500">
                          Vai trò
                        </div>
                        <div className="mt-1">
                          <span className="text-[12px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Số dư + Nạp tiền */}
                    <div className="text-right">
                      <div className="text-[11px] text-gray-500">Số dư</div>
                      <div className="mt-1 text-lg font-bold text-gray-900 leading-none">
                        {formatVND(user?.money)}
                      </div>
                      <button
                        onClick={() => {
                          setOpenUserBox(false);
                          navigate("/quan-ly/nap-tien");
                        }}
                        className="mt-2 text-xs bg-yellow-400/90 hover:bg-yellow-400 px-2.5 py-1.5 rounded-md"
                      >
                        💰 Nạp tiền
                      </button>
                    </div>
                  </div>
                </div>

                {/* Menu admin */}
                <div className="py-2">
                  <Link
                    to="/admin/bookings"
                    onClick={() => setOpenUserBox(false)}
                    className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-lg">📅</span>
                    <span>Quản lý Đặt phòng</span>
                  </Link>
                  <Link
                    to="/admin/posts"
                    onClick={() => setOpenUserBox(false)}
                    className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-lg">📰</span>
                    <span>Quản lý Bài viết</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setOpenUserBox(false)}
                    className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-lg">👥</span>
                    <span>Quản lý Người dùng</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-red-500 flex items-center gap-2"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thanh thông báo vai trò */}
        <div className="bg-amber-50 border-t border-amber-200">
          <div className="max-w-[1200px] mx-auto px-4 py-2 text-sm text-amber-900 flex items-center gap-2">
            <span>
              Bạn đang đăng nhập với vai trò:{" "}
              <b className="px-2 py-0.5 rounded-full bg-amber-100">
                {roleLabel}
              </b>
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
