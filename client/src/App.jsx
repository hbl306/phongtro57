// src/App.jsx
// Định nghĩa toàn bộ routes cho ứng dụng, tách route phòng đặt cọc theo role

import { Routes, Route, Navigate } from "react-router-dom";
import HomeShell from "./containers/Public/HomeShell.jsx";
import AuthPage from "./containers/Public/AuthPage.jsx";
import ManageLayout from "./containers/System/ManageLayout.jsx";
import PostList from "./containers/System/PostList.jsx";
import PostNew from "./containers/System/PostNew.jsx";
import PostDetail from "./containers/Public/PostDetail";
import { useAuth } from "./containers/Public/AuthContext.jsx";
import AdminHomeShell from "./containers/Admin/AdminHomeShell.jsx";
import AdminPostManage from "./containers/Admin/AdminPostManage.jsx";
import AdminBookingManage from "./containers/Admin/AdminBookingManage.jsx";
import AdminUserManage from "./containers/Admin/AdminUserManage.jsx";
import BookedRoomsForTenant from "./containers/System/BookedRoomsForTenant.jsx";
import BookedRoomsForLandlord from "./containers/System/BookedRoomsForLandlord.jsx";
import Recharge from "./containers/System/Recharge.jsx";
import RechargeHistory from "./containers/System/RechargeHistory.jsx";
import PaymentHistory from "./containers/System/PaymentHistory.jsx";
import PriceTable from "./containers/System/PriceTable.jsx";
import Profile from "./containers/System/Profile.jsx";
import SavedPost from "./containers/Public/SavedPosts.jsx";
/* ========= CÁC TRANG ĐƠN GIẢN (placeholder) ========= */

/**
 * Phòng được đặt cọc – dành cho ROLE 1 (người cho thuê)
 * Route: /quan-ly/phong-duoc-dat
 */
/**
 * Danh sách phòng đặt cọc – dành cho ROLE 0 (người thuê trọ)
 * Route: /quan-ly/phong-dat
 */

/* ========= TỰ ĐỘNG CHUYỂN TRANG KHI VÀO /quan-ly ========= */
/**
 * - ROLE 1 (người cho thuê)  → /quan-ly/dang-tin-moi
 * - ROLE 0 (người thuê trọ)  → /quan-ly/phong-dat
 * - Role khác / chưa đăng nhập → /quan-ly/tai-khoan
 */
function ManageIndexRedirect() {
  const { user } = useAuth();
  const role = Number(user?.role);

  if (role === 1) {
    return <Navigate to="dang-tin-moi" replace />;
  }

  if (role === 0) {
    return <Navigate to="phong-dat" replace />;
  }

  return <Navigate to="tai-khoan" replace />;
}

/* ========= ROUTE BẢO VỆ CHO ADMIN ========= */
/**
 * Chỉ cho phép:
 *  - Đã load xong trạng thái auth (authReady = true)
 *  - Có user && role === 2 (admin)
 * Ngược lại → đá về "/"
 */
function AdminRoute({ children }) {
  const { user, authReady } = useAuth();
  const role = Number(user?.role);

  if (!authReady) {
    // Đang load từ localStorage → tạm hiển thị trạng thái chờ
    return (
      <div className="min-h-screen bg-[#f9efe4] flex items-center justify-center">
        <p className="text-sm text-gray-500">Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  // Không đăng nhập hoặc không phải admin → quay về trang chủ
  if (!user || role !== 2) {
    return <Navigate to="/" replace />;
  }

  // Đúng là admin → cho vào
  return children;
}

/* ========= APP ========= */

export default function App() {
  return (
    <Routes>
      {/* Admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminHomeShell />
          </AdminRoute>
        }
      />
      <Route
  path="/admin/posts"
  element={
    <AdminRoute>
      <AdminPostManage />
    </AdminRoute>
  }
/>
<Route
  path="/admin/bookings"
  element={
    <AdminRoute>
      <AdminBookingManage />
    </AdminRoute>
  }
/>
<Route
  path="/admin/users"
  element={
    <AdminRoute>
      <AdminUserManage />
    </AdminRoute>
  }
/>

      {/* Public */}
      <Route path="/" element={<HomeShell />} />
      <Route path="/dang-ky-tai-khoan" element={<AuthPage />} />
      <Route path="/dang-nhap-tai-khoan" element={<AuthPage />} />

      {/* Khu quản lý: nested routes */}
      <Route path="/quan-ly" element={<ManageLayout />}>
        {/* Tự điều hướng theo vai trò khi chỉ vào /quan-ly */}
        <Route index element={<ManageIndexRedirect />} />

        {/* Route dành cho người cho thuê (ROLE 1) */}
        <Route path="dang-tin-moi" element={<PostNew />} />
        <Route path="tin-dang" element={<PostList />} />
        <Route path="phong-duoc-dat" element={<BookedRoomsForLandlord />} />
        {/* 🔥 Sửa tin: /quan-ly/tin-dang/sua-tin/:postId */}
        <Route path="tin-dang/sua-tin/:postId" element={<PostNew />} />
        <Route path="tin-dang/dang-lai/:postId" element={<PostNew />} />
        {/* Route dành cho người thuê trọ (ROLE 0) */}
        <Route path="phong-dat" element={<BookedRoomsForTenant />} />

        {/* Các route chung */}
        <Route path="nap-tien" element={<Recharge />} />
        <Route path="lich-su-nap" element={<RechargeHistory />} />
        <Route path="lich-su-thanh-toan" element={<PaymentHistory />} />
        <Route path="bang-gia" element={<PriceTable />} />
        <Route path="tai-khoan" element={<Profile />} />
        <Route path="tin-da-luu" element={<SavedPost />} />
      </Route>

      {/* Trang chi tiết bài đăng + filter theo category / tỉnh */}
      <Route path="/bai-dang/:id" element={<PostDetail />} />
      <Route path="/c/:categoryCode" element={<HomeShell />} />
      <Route path="/p/:provinceSlug" element={<HomeShell />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
