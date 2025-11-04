import Header from "../../components/layout/Header.jsx";
import ManageSidebar from "./ManageSidebar.jsx";
import { Routes, Route } from "react-router-dom";

import PostList from "./PostList.jsx";
import PostNew from "./PostNew.jsx";

function Recharge() {
  return <div className="p-6">Nạp tiền vào tài khoản</div>;
}
function RechargeHistory() {
  return <div className="p-6">Lịch sử nạp tiền</div>;
}
function PaymentHistory() {
  return <div className="p-6">Lịch sử thanh toán</div>;
}
function PriceTable() {
  return <div className="p-6">Bảng giá dịch vụ</div>;
}
function Profile() {
  return <div className="p-6">Quản lý tài khoản</div>;
}

export default function ManageLayout() {
  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <Header />

      <div className="flex">
        <ManageSidebar />

        <div className="flex-1">
          <Routes>
           
            <Route path="tin-dang" element={<PostList />} />
            <Route path="dang-tin-moi" element={<PostNew />} />
            <Route path="nap-tien" element={<Recharge />} />
            <Route path="lich-su-nap" element={<RechargeHistory />} />
            <Route path="lich-su-thanh-toan" element={<PaymentHistory />} />
            <Route path="bang-gia" element={<PriceTable />} />
            <Route path="tai-khoan" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
