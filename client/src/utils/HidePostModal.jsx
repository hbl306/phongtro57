// src/utils/HidePostModal.jsx
import { useState } from "react";
import Modal from "../components/ui/Modal.jsx";
import { hidePost } from "../services/postService";

export default function HidePostModal({ open, post, onClose, onUpdated }) {
  const [hiding, setHiding] = useState(false);

  if (!open || !post) return null;

  const handleConfirm = async () => {
    try {
      setHiding(true);
      const res = await hidePost(post.id);
      const newStatus = res?.data?.status || "hidden";

      onUpdated?.({
        id: post.id,
        status: newStatus,
      });

      onClose();
      alert("Ẩn tin thành công!");
    } catch (err) {
      alert(err?.message || "Ẩn tin thất bại");
    } finally {
      setHiding(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ẩn tin đăng"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={hiding}
            className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
          >
            {hiding ? "Đang ẩn tin..." : "Xác nhận"}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-[15px]">
        <div>
          <div className="text-sm font-medium mb-1">Bài đăng</div>
          <div className="text-sm text-gray-700 line-clamp-2">
            {post.title}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm space-y-1">
          <p>
            Tin này sẽ được chuyển sang trạng thái <b>ẩn (hidden)</b> và
            không còn hiển thị với người tìm phòng.
          </p>
          <p>
            Bạn vẫn có thể xem và quản lý tin trong khu vực{" "}
            <b>Quản lý tin đăng</b>.
          </p>
        </div>
      </div>
    </Modal>
  );
}
