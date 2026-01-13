// src/containers/Admin/AdminPageLayout.jsx
import AdminHeader from "../../components/layout/AdminHeader.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

export default function AdminPageLayout({ activeKey, children }) {
  return (
    <div className="min-h-screen bg-[#f9efe4] flex flex-col">
      {/* Header dùng chung */}
      <AdminHeader />

      {/* Body: sidebar + content */}
      <div className="sticky top-0 h-screen overflow-y-auto flex max-w-[1280px] mx-auto w-full px-4 pb-8 pt-4 gap-5">
        <AdminSidebar activeKey={activeKey} />

        {/* Nội dung trang con */}
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}
