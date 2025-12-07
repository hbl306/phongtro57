// src/components/layout/Header.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../containers/Public/AuthContext.jsx";
import LocationFilterModal from "../listing/LocationFilterModal";
import FilterModal from "../listing/FilterModal";

const ROLE_TEXT = {
  0: "Người thuê trọ",
  1: "Người cho thuê",
  2: "Quản trị viên",
};

const formatVND = (n = 0) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

export default function Header() {
  // ⬇ thêm refreshUser để làm mới số dư
  const { user, logout, refreshUser } = useAuth();

  const [openUserBox, setOpenUserBox] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const navigate = useNavigate();
  const userBoxRef = useRef(null);
  const [sp] = useSearchParams();

  const roleNumber = Number(user?.role);
  const roleLabel = ROLE_TEXT?.[roleNumber] || "Người dùng";

  // Link "Quản lý" tuỳ theo role (admin dùng fallback, không route admin nữa)
  const manageLink =
    roleNumber === 0
      ? "/quan-ly/phong-dat" // Người thuê trọ
      : roleNumber === 1
      ? "/quan-ly/tin-dang" // Người cho thuê
      : "/quan-ly/tai-khoan"; // mặc định

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

  const gotoPost = () => {
    if (!user) return navigate("/dang-nhap-tai-khoan");
    navigate("/quan-ly/dang-tin-moi");
  };

  // label hiển thị khu vực hiện tại
  const provinceName = sp.get("provinceName");
  const district = sp.get("district");
  const ward = sp.get("ward");
  const locationLabel = ward || district || provinceName || "Tìm theo khu vực";

  // ⬇ Khi bấm logo về trang chủ: làm mới user (số dư) + đóng popup user
  const handleClickHome = async () => {
    setOpenUserBox(false);
    if (user && typeof refreshUser === "function") {
      try {
        await refreshUser();
      } catch (e) {
        console.error("refreshUser error >>>", e);
      }
    }
  };

  return (
    <>
      <header className="w-full bg-white sticky top-0 z-30 shadow-[0_1px_0_#eef]">
        {/* Hàng trên */}
        <div className="max-w-[1200px] mx-auto flex items-center gap-4 py-3 px-4">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleClickHome}
            className="flex items-center gap-2"
          >
            <div className="text-[20px] font-bold text-[#0066cc] leading-none">
              PHONGTRO<span className="text-orange-500">57</span>.COM
            </div>
            <p className="text-xs text-gray-500">
              Kênh thông tin phòng trọ số 1 Việt Nam
            </p>
          </Link>

          {/* Search + Filter */}
          <div className="flex-1 flex items-center gap-3 ml-4">
            {/* Nút Tìm theo khu vực */}
            <button
              type="button"
              onClick={() => setOpenLocation(true)}
              className="flex-1 flex items-center gap-2 bg-[#f5f6f7] rounded-full px-5 py-2 text-gray-600 text-sm hover:bg-[#e7e8ec] transition"
            >
              <span className="truncate">{locationLabel}</span>
            </button>

            {/* Nút Bộ lọc */}
            <button
              type="button"
              onClick={() => setOpenFilter(true)}
              className="bg-white border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-full text-sm shadow-sm flex items-center gap-1"
              title="Bộ lọc"
            >
              <span>Bộ lọc</span>
            </button>
          </div>

          {/* Khu vực phải */}
          {!user ? (
            <div className="flex items-center gap-5 text-sm">
              <Link to="/dang-ky-tai-khoan" className="text-gray-700">
                Đăng ký
              </Link>
              <Link to="/dang-nhap-tai-khoan" className="text-gray-700">
                Đăng nhập
              </Link>
              <button
                onClick={gotoPost}
                className="bg-[#ff5e2e] text-white px-5 py-2 rounded-full font-semibold"
              >
                Đăng tin
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-4 text-sm relative"
              ref={userBoxRef}
            >
              {/* Nút "Tin đã lưu" – CHỈ cho role 0 (người thuê trọ) */}
              {roleNumber === 0 && (
                <Link
                  to="/quan-ly/tin-da-luu"
                  className="px-3 py-1.5 rounded-full bg-[#eef7ff] text-[#0050b3] border border-[#cce0ff] font-semibold hover:bg-[#e0f0ff]"
                >
                  Tin đã lưu
                </Link>
              )}

              {/* Ô Quản lý – link khác nhau tuỳ role (không còn route admin riêng) */}
              <Link
                to={manageLink}
                className="px-3 py-1.5 rounded-full bg-[#fff3ec] text-[#ff5e2e] border border-[#ffd0b3] font-semibold hover:bg-[#ffe3d1]"
              >
                Quản lý
              </Link>

              {/* Avatar + tên */}
              <button
                onClick={() => setOpenUserBox((p) => !p)}
                className="flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="max-w-[90px] truncate">{user.name}</span>
                <span className="text-xs">▾</span>
              </button>

              {/* Popup tài khoản */}
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

                  {/* Menu theo role – BỎ hẳn nhánh admin, chỉ còn 0 & 1 */}
                  <div className="py-2">
                    {roleNumber === 0 && (
                      <>
                        <Link
                          to="/quan-ly/phong-dat"
                          onClick={() => setOpenUserBox(false)}
                          className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="text-lg">🏠</span>
                          <span>Quản lý phòng đặt</span>
                        </Link>
                        <Link
                          to="/quan-ly/nap-tien"
                          onClick={() => setOpenUserBox(false)}
                          className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="text-lg">💳</span>
                          <span>Quản lý giao dịch</span>
                        </Link>
                        <Link
                          to="/quan-ly/tai-khoan"
                          onClick={() => setOpenUserBox(false)}
                          className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="text-lg">👤</span>
                          <span>Quản lý tài khoản</span>
                        </Link>
                      </>
                    )}

                    {roleNumber === 1 && (
                      <>
                        <Link
                          to="/quan-ly/tin-dang"
                          onClick={() => setOpenUserBox(false)}
                          className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="text-lg">📝</span>
                          <span>Quản lý tin đăng</span>
                        </Link>
                        <Link
                          to="/quan-ly/nap-tien"
                          onClick={() => setOpenUserBox(false)}
                          className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="text-lg">💳</span>
                          <span>Quản lý giao dịch</span>
                        </Link>
                        <Link
                          to="/quan-ly/tai-khoan"
                          onClick={() => setOpenUserBox(false)}
                          className="block px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="text-lg">👤</span>
                          <span>Quản lý tài khoản</span>
                        </Link>
                      </>
                    )}

                    {/* Admin (role 2) không còn menu riêng ở đây, chỉ có nút Đăng xuất */}

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

              {/* Nút Đăng tin chỉ cho role 1 (chủ phòng) */}
              {roleNumber === 1 && (
                <button
                  onClick={gotoPost}
                  className="bg-[#ff5e2e] text-white px-5 py-2 rounded-full font-semibold"
                >
                  Đăng tin
                </button>
              )}
            </div>
          )}
        </div>

        {/* Thanh thông báo vai trò */}
        {user && (
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
        )}
      </header>

      {/* Popup chọn khu vực */}
      <LocationFilterModal
        open={openLocation}
        onClose={() => setOpenLocation(false)}
      />

      {/* Popup Bộ lọc */}
      <FilterModal open={openFilter} onClose={() => setOpenFilter(false)} />
    </>
  );
}
