// src/utils/ExtendModal.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal.jsx";
import { extendPost } from "../services/postService";
import { useAuth } from "../containers/Public/AuthContext.jsx";

export const EXTEND_OPTIONS = [
  { days: 3, price: 15000 },
  { days: 7, price: 30000 },
  { days: 30, price: 135000 },
];

export const EXTEND_PRICE = {
  3: 15000,
  7: 30000,
  30: 135000,
};

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function calcExpireDate(createdAt, star) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  const days = Number(star || 0);
  if (days > 0) d.setDate(d.getDate() + days);
  return d;
}

export default function ExtendModal({ open, post, onClose, onUpdated }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [extendDays, setExtendDays] = useState(3);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    if (open && post) {
      setExtendDays(3);
    }
  }, [open, post]);

  if (!open || !post) return null;

  const currentBalance = user?.money ?? 0;
  const extendCost = EXTEND_PRICE[extendDays] || 0;
  const canAffordExtend = currentBalance >= extendCost;

  const handleConfirm = async () => {
    try {
      setExtending(true);

      const res = await extendPost(post.id, extendDays);

      if (typeof res.balance !== "undefined" && updateUser) {
        updateUser({ money: res.balance });
      }

      const newStar =
        res?.data?.star ?? (Number(post.star || 0) + extendDays);
      const newStatus = res?.data?.status || post.status;
      const newCreatedAt = res?.data?.createdAt || post.createdAt;

      onUpdated?.({
        id: post.id,
        star: newStar,
        status: newStatus,
        createdAt: newCreatedAt,
      });

      onClose();
      alert("Gia hạn bài đăng thành công!");
    } catch (err) {
      if (err?.code === "INSUFFICIENT_BALANCE" || err?.status === 402) {
        alert(
          "Số dư tài khoản không đủ, vui lòng nạp thêm tiền để tiếp tục gia hạn."
        );
        onClose();
        navigate("/quan-ly/nap-tien");
      } else {
        alert(err?.message || "Gia hạn tin thất bại");
      }
    } finally {
      setExtending(false);
    }
  };

  const currentExpire = calcExpireDate(post.createdAt, post.star);
  let newExpire = null;
  if (currentExpire) {
    newExpire = new Date(currentExpire.getTime());
    newExpire.setDate(newExpire.getDate() + Number(extendDays || 0));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gia hạn hiển thị cho bài đăng"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            Hủy
          </button>
          {canAffordExtend ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={extending}
              className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {extending ? "Đang gia hạn..." : "Xác nhận gia hạn"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/quan-ly/nap-tien");
              }}
              className="px-5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
            >
              Nạp tiền
            </button>
          )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Ngày đăng</div>
            <div className="font-medium">
              {post.createdAt
                ? new Date(post.createdAt).toLocaleString("vi-VN")
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Ngày hết hạn hiện tại</div>
            <div className="font-medium">
              {currentExpire
                ? currentExpire.toLocaleString("vi-VN")
                : "-"}
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">
            Chọn thời gian gia hạn
          </div>
          <div className="grid gap-2">
            {EXTEND_OPTIONS.map((opt) => (
              <label
                key={opt.days}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border cursor-pointer ${
                  extendDays === opt.days
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{opt.days} ngày</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {formatVND(opt.price)}
                  </span>
                  <input
                    type="radio"
                    className="accent-orange-500"
                    checked={extendDays === opt.days}
                    onChange={() => setExtendDays(opt.days)}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Ngày hết hạn mới (dự kiến)</div>
            <div className="font-medium">
              {newExpire
                ? newExpire.toLocaleString("vi-VN")
                : "-"}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
          <p>
            Số dư hiện tại: <b>{formatVND(currentBalance)}</b>
          </p>
          <p>
            Phí gia hạn: <b>{formatVND(extendCost)}</b>
          </p>
          <p>
            Số dư dự kiến còn lại:{" "}
            <b>{formatVND(currentBalance - extendCost)}</b>
          </p>
          {currentBalance < extendCost && (
            <p className="text-red-600 mt-1">
              * Số dư hiện tại không đủ, vui lòng nạp thêm để gia hạn.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
