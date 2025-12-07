// src/utils/BookingModal.jsx
import React, { useMemo, useState } from "react";
import Modal from "../components/ui/Modal.jsx";
import { useAuth } from "../containers/Public/AuthContext.jsx";
import { bookPost } from "../services/postService";

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function BookingModal({ open, post, onClose, onBooked }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    price,
    deposit,
    balance,
    canAfford,
    balanceAfter,
  } = useMemo(() => {
    const p = Number(post?.price || 0);
    const rawDeposit = p > 0 ? Math.round(p * 0.3) : 0;
    const unit = 10000; // làm tròn đến hàng chục nghìn
    const depo =
      rawDeposit > 0 ? Math.round(rawDeposit / unit) * unit : 0;

    const bal = Number(user?.money || 0);
    const afford = bal >= depo;
    const balAfter = afford ? bal - depo : bal - depo; // có thể âm, chỉ để hiển thị

    return {
      price: p,
      deposit: depo,
      balance: bal,
      canAfford: afford,
      balanceAfter: balAfter,
    };
  }, [post, user]);

  const handleConfirm = async () => {
    if (!post?.id || !canAfford || loading) return;

    try {
      setLoading(true);
      const res = await bookPost(post.id);
      const newBalance =
        typeof res.balance !== "undefined" ? res.balance : null;

      if (newBalance !== null && updateUser) {
        updateUser({ money: newBalance });
      }

      if (onBooked) {
        onBooked({
          id: post.id,
          status: res?.data?.postStatus || "booking",
        });
      }

      onClose();
      alert("Đặt phòng thành công!");
    } catch (err) {
      // lỗi thiếu tiền từ BE
      const code =
        err?.code || err?.response?.data?.code || err?.response?.status;
      if (code === "INSUFFICIENT_BALANCE" || code === 402) {
        alert(
          err?.response?.data?.message ||
            "Số dư tài khoản không đủ, vui lòng nạp thêm tiền."
        );
      } else {
        alert(
          err?.response?.data?.message || "Đặt phòng thất bại, vui lòng thử lại."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGotoTopup = () => {
    window.location.assign("/quan-ly/nap-tien");
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title="Đặt phòng"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
          >
            Hủy
          </button>
          {canAfford ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !post}
              className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? "Đang đặt phòng..." : "Xác nhận đặt phòng"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGotoTopup}
              className="px-5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
            >
              Nạp tiền
            </button>
          )}
        </>
      }
    >
      {post ? (
        <div className="space-y-4 text-[15px]">
          <div>
            <div className="text-sm font-medium text-gray-500">
              Tên phòng
            </div>
            <div className="font-semibold text-gray-900 line-clamp-2">
              {post.title}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Giá phòng</div>
              <div className="font-medium text-emerald-600">
                {price ? formatVND(price) : "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Tiền cọc (30%)</div>
              <div className="font-semibold text-orange-600">
                {deposit ? formatVND(deposit) : "—"}
              </div>
            </div>
          </div>

          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">
            Tiền cọc phòng sẽ là <b>30% giá phòng hiện tại</b>. Bạn có
            thể hủy đặt phòng bất kì lúc nào và nhận lại số tiền này.
          </p>

          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <p>
              Số dư tài khoản: <b>{formatVND(balance)}</b>
            </p>
            <p>
              Số tiền cọc: <b>{formatVND(deposit)}</b>
            </p>
            <p>
              Số dư dự kiến sau đặt phòng:{" "}
              <b
                className={
                  canAfford ? "text-gray-900" : "text-red-600"
                }
              >
                {formatVND(balanceAfter)}
              </b>
            </p>
            {!canAfford && (
              <p className="text-red-600 mt-1">
                * Số dư hiện tại không đủ, vui lòng nạp thêm để đặt
                phòng.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Không tìm thấy thông tin phòng.
        </p>
      )}
    </Modal>
  );
}
