import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../../components/layout/AdminHeader.jsx";
import { useAuth } from "../Public/AuthContext.jsx";

export default function AdminHomeShell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // TODO: sau này thay bằng dữ liệu thật từ API
  const [stats] = useState({
    pendingPosts: 0,     // số bài viết trạng thái pending
    bookingRooms: 0,     // số phòng trạng thái booking
    revenue: 0,          // doanh số (VND)
  });

  const goTo = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-[#f9efe4]">
      {/* Header dùng chung */}
      <AdminHeader />

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Chào admin nhỏ nhỏ */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Bảng điều khiển quản trị
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Xin chào, <b>{user?.name || "Admin"}</b> — quản lý hệ thống phòng trọ.
          </p>
        </div>

        {/* 3 option chuyển trang */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => goTo("/admin/posts")}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-orange-400 transition"
          >
            <div className="text-xs font-semibold uppercase text-gray-400 mb-1">
              Quản lý
            </div>
            <div className="text-base font-semibold text-gray-900 mb-1">
              Bài đăng
            </div>
            <p className="text-xs text-gray-500">
              Xem, duyệt, chỉnh sửa và xoá các bài đăng của người dùng.
            </p>
          </button>

          <button
            onClick={() => goTo("/admin/bookings")}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-orange-400 transition"
          >
            <div className="text-xs font-semibold uppercase text-gray-400 mb-1">
              Quản lý
            </div>
            <div className="text-base font-semibold text-gray-900 mb-1">
              Phòng đặt
            </div>
            <p className="text-xs text-gray-500">
              Theo dõi các phòng đang được đặt và trạng thái đặt cọc.
            </p>
          </button>

          <button
            onClick={() => goTo("/admin/users")}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-orange-400 transition"
          >
            <div className="text-xs font-semibold uppercase text-gray-400 mb-1">
              Quản lý
            </div>
            <div className="text-base font-semibold text-gray-900 mb-1">
              Người dùng
            </div>
            <p className="text-xs text-gray-500">
              Xem danh sách người dùng, phân quyền và khoá/mở tài khoản.
            </p>
          </button>
        </section>

        {/* Khối thống kê tổng quan */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bài viết mới / pending */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Số lượng bài viết mới
            </h2>
            <p className="text-xs text-gray-500 mb-1">
              Bài viết chưa được duyệt (trạng thái <b>pending</b>):
            </p>
            <div className="text-3xl font-bold text-orange-500">
              {stats.pendingPosts}
            </div>
          </div>

          {/* Phòng được đặt */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Số phòng được đặt
            </h2>
            <p className="text-xs text-gray-500 mb-1">
              Tổng số phòng đang ở trạng thái <b>booking</b>:
            </p>
            <div className="text-3xl font-bold text-blue-600">
              {stats.bookingRooms}
            </div>
          </div>

          {/* Thống kê doanh số */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Thống kê doanh số
            </h2>
            <p className="text-xs text-gray-500 mb-1">
              Doanh thu dựa trên các giao dịch đã hoàn tất:
            </p>
            <div className="text-2xl font-bold text-green-600">
              {stats.revenue.toLocaleString("vi-VN")}đ
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              (* Có thể thống kê theo ngày / tháng / năm ở bước sau.)
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
