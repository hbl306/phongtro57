import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../containers/Public/AuthContext.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const [openUserBox, setOpenUserBox] = useState(false);
  const navigate = useNavigate();
  const userBoxRef = useRef(null);

  // đóng khi click ra ngoài
  useEffect(() => {
    function handleClick(e) {
      if (userBoxRef.current && !userBoxRef.current.contains(e.target)) {
        setOpenUserBox(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setOpenUserBox(false);
    navigate("/");
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-[1200px] mx-auto flex items-center gap-4 py-3 px-4">
        {/* logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="text-[20px] font-bold text-[#0066cc] leading-none">
            PHONGTRO<span className="text-orange-500">57</span>.COM
          </div>
          <p className="text-xs text-gray-500">Kênh thông tin phòng trọ số 1 Việt Nam</p>
        </Link>

        {/* search + filter */}
        <div className="flex-1 flex items-center gap-3 ml-4">
          <div className="flex-1 bg-[#f5f6f7] rounded-full px-5 py-2 text-gray-600 text-sm">
            Tìm theo khu vực
          </div>
          <button className="bg-white border px-4 py-2 rounded-full text-sm">
            Bộ lọc
          </button>
        </div>

        {/* right */}
        {!user ? (
          <div className="flex items-center gap-5 text-sm">
            <Link to="/dang-nhap-tai-khoan" className="text-gray-700">
              Tin đã lưu
            </Link>
            <Link to="/dang-ky-tai-khoan" className="text-gray-700">
              Đăng ký
            </Link>
            <Link to="/dang-nhap-tai-khoan" className="text-gray-700">
              Đăng nhập
            </Link>
            <Link
              to="/dang-tin"
              className="bg-[#ff5e2e] text-white px-5 py-2 rounded-full font-semibold"
            >
              Đăng tin
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm relative" ref={userBoxRef}>
            <Link to="/tin-da-luu" className="text-gray-700">
              Tin đã lưu
            </Link>
            <Link to="/quan-ly/tin-dang" className="text-gray-700">
              Quản lý
            </Link>

            {/* nút user */}
            <button
              onClick={() => setOpenUserBox((p) => !p)}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <span className="max-w-[80px] truncate">{user.name}</span>
              <span className="text-xs">▾</span>
            </button>

            {/* popup user */}
            {openUserBox && (
              <div className="absolute right-0 top-[110%] w-[350px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {/* top info */}
                <div className="flex gap-3 p-4 bg-[#f9fafb]">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold leading-tight">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Số dư tài khoản</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-lg font-bold text-gray-800">0</div>
                      <button className="text-xs bg-yellow-400/90 hover:bg-yellow-400 px-2 py-1 rounded-md">
                        Nạp tiền
                      </button>
                    </div>
                  </div>
                </div>

                {/* quản lý tin đăng */}
                <div className="px-4 pt-3 pb-2 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      Quản lý tin đăng
                    </div>
                    <button className="text-xs text-blue-500 hover:underline">
                      Xem tất cả
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <span className="text-gray-700">Tất cả</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <span className="text-gray-700 text-center">Đang hiển thị</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <span className="text-gray-700 text-center">Hết hạn</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <span className="text-gray-700 text-center">Tin ẩn</span>
                    </button>
                  </div>
                </div>

                {/* menu dưới */}
                <div className="py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                    <span>📋</span> <span>Bảng giá dịch vụ</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                    <span>📦</span> <span>Quản lý giao dịch</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                    <span>⚙️</span> <span>Quản lý tài khoản</span>
                  </button>
                  {user.is_admin === 1 && (
                    <Link
                      to="/admin/users"
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setOpenUserBox(false)}
                    >
                      <span>🛠</span> <span>Quản lý người dùng</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 text-red-500"
                  >
                    <span>🚪</span> <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}

            <Link
              to="/dang-tin"
              className="bg-[#ff5e2e] text-white px-5 py-2 rounded-full font-semibold"
            >
              Đăng tin
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
