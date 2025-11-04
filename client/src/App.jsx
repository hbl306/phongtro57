import { Routes, Route, Navigate } from "react-router-dom";
import HomeShell from "./containers/Public/HomeShell.jsx";
import AuthPage from "./containers/Public/AuthPage.jsx";
import ManageLayout from "./containers/System/ManageLayout.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeShell />} />
      <Route path="/dang-ky-tai-khoan" element={<AuthPage />} />
      <Route path="/dang-nhap-tai-khoan" element={<AuthPage />} />

      {/* Khu quản lý */}
      <Route path="/quan-ly/*" element={<ManageLayout />} />

      {/* Redirect tất cả về trang chủ nếu không match */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
