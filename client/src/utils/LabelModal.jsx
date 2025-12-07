// src/utils/LabelModal.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal.jsx";
import { updatePostLabel } from "../services/postService";
import { useAuth } from "../containers/Public/AuthContext.jsx";

import HotLabel from "../assets/HOT.png";
import Vip1Label from "../assets/VIP1.png";
import Vip2Label from "../assets/VIP2.png";
import Vip3Label from "../assets/VIP3.png";

export const LABEL_META = {
  HOT: { code: "HOT", name: "Nổi bật", price: 50000, img: HotLabel },
  VIP1: { code: "VIP1", name: "Vip1", price: 30000, img: Vip1Label },
  VIP2: { code: "VIP2", name: "Vip2", price: 20000, img: Vip2Label },
  VIP3: { code: "VIP3", name: "Vip3", price: 10000, img: Vip3Label },
};

export const LABEL_OPTIONS = ["", "HOT", "VIP1", "VIP2", "VIP3"]; // '' = không gắn nhãn

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export function renderLabelBadge(code, extraClass = "") {
  const c = (code || "").toUpperCase();
  const meta = LABEL_META[c];
  if (!meta) {
    return (
      <span
        className={
          "inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs " +
          extraClass
        }
      >
        Không gắn nhãn
      </span>
    );
  }
  return (
    <span
      className={
        "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-orange-200 text-xs " +
        extraClass
      }
    >
      <img
        src={meta.img}
        alt={meta.name}
        className="w-10 h-6 object-contain rounded-[4px]"
      />
      <span className="font-medium">{meta.name}</span>
    </span>
  );
}

export default function LabelModal({ open, post, onClose, onUpdated }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [selectedLabel, setSelectedLabel] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (open && post) {
      setSelectedLabel(post.labelCode || "");
    }
  }, [open, post]);

  if (!open || !post) return null;

  const currentBalance = user?.money ?? 0;

  const activeLabelCode = (post.labelCode || "").toUpperCase();
  const selectedLabelCode = (selectedLabel || "").toUpperCase();
  const currentSelectedMeta = LABEL_META[selectedLabelCode] || null;
  const rawLabelPrice = currentSelectedMeta?.price || 0;

  const isRemovingLabel = !selectedLabelCode;
  const isSameLabel = selectedLabelCode === activeLabelCode;
  const labelCost = isRemovingLabel || isSameLabel ? 0 : rawLabelPrice;
  const canAffordLabel = currentBalance >= labelCost;

  const handleConfirm = async () => {
    try {
      setChanging(true);

      const res = await updatePostLabel(post.id, selectedLabel || "");

      if (typeof res.balance !== "undefined" && updateUser) {
        updateUser({ money: res.balance });
      }

      const newLabel = res?.data?.labelCode ?? selectedLabel ?? "";

      onUpdated?.({
        id: post.id,
        labelCode: newLabel,
        balance: res.balance,
      });

      onClose();
      alert("Cập nhật nhãn thành công!");
    } catch (err) {
      if (err?.code === "INSUFFICIENT_BALANCE" || err?.status === 402) {
        alert("Số dư tài khoản không đủ, vui lòng nạp thêm tiền để tiếp tục.");
        onClose();
        navigate("/quan-ly/nap-tien");
      } else {
        alert(err?.message || "Cập nhật nhãn thất bại");
      }
    } finally {
      setChanging(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gắn nhãn cho bài đăng"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            Hủy
          </button>
          {canAffordLabel ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={changing}
              className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {changing ? "Đang cập nhật..." : "Xác nhận"}
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

        <div>
          <div className="text-sm font-medium mb-1">Nhãn hiện tại</div>
          {renderLabelBadge(post.labelCode)}
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Chọn nhãn mới</div>
          <div className="grid gap-2">
            {LABEL_OPTIONS.map((code) => {
              const meta = LABEL_META[code] || null;
              const isNone = !code;
              const price = meta?.price || 0;
              return (
                <label
                  key={code || "none"}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border cursor-pointer ${
                    selectedLabel === code
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isNone ? (
                      <div className="w-10 h-6 flex items-center justify-center text-xs text-gray-500 bg-gray-100 rounded-[4px]">
                        none
                      </div>
                    ) : (
                      <img
                        src={meta.img}
                        alt={meta.name}
                        className="w-10 h-6 object-contain rounded-[4px]"
                      />
                    )}
                    <span className="text-sm">
                      {isNone ? "Không gắn nhãn" : meta.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {price ? formatVND(price) : "0đ"}
                    </span>
                    <input
                      type="radio"
                      className="accent-orange-500"
                      checked={selectedLabel === code}
                      onChange={() => setSelectedLabel(code)}
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
          <p>
            Số dư hiện tại: <b>{formatVND(currentBalance)}</b>
          </p>
          <p>
            Phí nhãn mới: <b>{formatVND(labelCost)}</b>
          </p>
          <p>
            Số dư dự kiến còn lại:{" "}
            <b>{formatVND(currentBalance - labelCost)}</b>
          </p>
          {currentBalance < labelCost && (
            <p className="text-red-600 mt-1">
              * Số dư hiện tại không đủ, vui lòng nạp thêm để gắn nhãn.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
