// src/containers/System/ManageLayout.jsx
import Header from "../../components/layout/Header.jsx";
import ManageSidebar from "./ManageSidebar.jsx";
import { Outlet, useLocation } from "react-router-dom";

export default function ManageLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <Header />
      <div className="flex">
        <ManageSidebar />
        {/* ép remount theo path để tránh “kẹt” */}
        <div className="flex-1" key={location.pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
