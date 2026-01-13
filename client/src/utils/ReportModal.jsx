// src/utils/ReportModal.jsx
import React, { useEffect, useState } from "react";
import Modal from "../components/ui/Modal.jsx";
import { createReport } from "../services/postService.js";

const REASONS = [
  { value: "fraud", label: "Tin có dấu hiệu lừa đảo" },
  { value: "duplicate", label: "Tin trùng lặp nội dung" },
  { value: "cant_contact", label: "Không liên hệ được chủ tin đăng" },
  {
    value: "incorrect_info",
    label: "Thông tin không đúng thực tế (giá, diện tích, hình ảnh...)",
  },
  { value: "other", label: "Lý do khác" },
];

export default function ReportModal({ open, onClose, post, currentUser }) {
  const [reason, setReason] = useState(REASONS[0].value);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setReason(REASONS[0].value);
    setDescription("");

    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
    } else {
      setName("");
      setPhone("");
    }
  }, [open, currentUser]);

  const handleSubmit = async () => {
    if (!post?.id) {
      alert("Không xác định được bài đăng để phản ánh.");
      return;
    }
    if (!reason) {
      alert("Vui lòng chọn lý do phản ánh.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      alert("Vui lòng nhập đầy đủ họ tên và số điện thoại.");
      return;
    }

    try {
      setSubmitting(true);

      await createReport(post.id, {
        reason,
        description,
        reporter_name: name.trim(),
        reporter_phone: phone.trim(),
      });

      setSubmitting(false);
      onClose?.();
      alert("Cảm ơn bạn đã gửi phản ánh. Hệ thống sẽ xem xét sớm nhất.");
    } catch (err) {
      console.error("Gửi báo xấu lỗi:", err);
      setSubmitting(false);
      alert(err?.message || "Gửi báo xấu thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Phản ánh tin đăng"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {submitting ? "Đang gửi..." : "Gửi phản ánh"}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {post && (
          <p className="text-xs text-gray-500">
            Bạn đang phản ánh tin:{" "}
            <span className="font-medium text-gray-800">{post.title}</span>{" "}
            (Mã tin {String(post.id).slice(0, 8)}…)
          </p>
        )}

        <div>
          <div className="font-semibold mb-2">Lý do phản ánh:</div>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="accent-orange-500"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">Mô tả thêm</div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
            placeholder="Nhập nội dung mô tả chi tiết hơn về vấn đề bạn gặp phải…"
          />
        </div>

        <div className="border-t pt-3 space-y-3">
          <div className="font-semibold text-sm">Thông tin liên hệ</div>
          <div className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Họ tên của bạn"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại của bạn"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <p className="text-[11px] text-gray-400">
            Chúng tôi chỉ sử dụng thông tin liên hệ để xác minh & hỗ trợ thêm khi cần thiết.
          </p>
        </div>
      </div>
    </Modal>
  );
}
