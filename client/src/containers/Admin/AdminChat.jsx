// src/containers/Admin/AdminChat.jsx
import AdminPageLayout from "./AdminPageLayout.jsx";

export default function AdminChat() {
  return (
    <AdminPageLayout activeKey="chat">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/60">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Chat với khách hàng
        </h1>
        <p className="text-sm text-gray-600">
          Tính năng chat đang được phát triển. Sau này bạn có thể xem và trả lời
          tin nhắn giữa người thuê và chủ nhà ngay tại đây.
        </p>
      </div>
    </AdminPageLayout>
  );
}
