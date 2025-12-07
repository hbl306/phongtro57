// client/src/containers/System/Recharge.jsx
import React, { useState } from "react";
import TransactionTabs from "../../components/sidebar/TransactionTabs.jsx";
import walletService from "../../services/walletService.js";
import { useAuth } from "../Public/AuthContext.jsx";

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000];

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function Recharge() {
  const { user } = useAuth();

  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rechargeInfo, setRechargeInfo] = useState(null); // dữ liệu trả về từ BE

  const handlePresetClick = (value) => {
    setSelectedPreset(value);
    setAmount(String(value));
  };

  const handleAmountChange = (e) => {
    setSelectedPreset(null);
    setAmount(e.target.value.replace(/[^\d]/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRechargeInfo(null);

    const value = Number(amount || 0);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (value < 10000) {
      setError("Số tiền nạp tối thiểu là 10.000đ.");
      return;
    }

    try {
      setLoading(true);
      const data = await walletService.createRecharge(value);
      setRechargeInfo(data);
      setSuccess(
        "Tạo yêu cầu nạp tiền thành công. Vui lòng chuyển khoản theo thông tin bên dưới, hệ thống sẽ tự cộng tiền sau khi nhận được giao dịch."
      );
    } catch (err) {
      console.error("create recharge error >>>", err);
      setError(err?.message || "Không tạo được yêu cầu nạp tiền.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Quản lý giao dịch
        </h1>
        <TransactionTabs active="recharge" />
      </div>

      <div className="px-6 py-6 flex-1 overflow-auto bg-[#f5f5f7]">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Card nhập số tiền */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="font-semibold mb-2 text-gray-900">
              Nạp tiền vào tài khoản
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Chọn số tiền cần nạp, hệ thống sẽ tạo mã VietQR với nội dung chuyển khoản riêng cho tài khoản của bạn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Số dư hiện tại (nếu có) */}
              <div className="text-sm text-gray-700">
                Số dư hiện tại:&nbsp;
                <span className="font-semibold text-emerald-600">
                  {formatVND(user?.money ?? 0)}
                </span>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handlePresetClick(v)}
                    className={
                      "px-3 py-1.5 rounded-full text-xs font-semibold border transition " +
                      (selectedPreset === v
                        ? "bg-orange-50 border-orange-500 text-orange-600"
                        : "border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600")
                    }
                  >
                    {formatVND(v)}
                  </button>
                ))}
              </div>

              {/* Ô nhập số tiền */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Số tiền muốn nạp (VNĐ)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Ví dụ: 200000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
                <p className="text-xs text-gray-500">
                  Tối thiểu 10.000đ. Chỉ nhập số, không nhập dấu chấm phẩy.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-emerald-600">
                  {success}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
                >
                  {loading ? "Đang tạo mã VietQR..." : "Tạo mã nạp tiền VietQR"}
                </button>
              </div>
            </form>
          </div>

          {/* Card thông tin QR sau khi tạo */}
          {rechargeInfo && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Thông tin chuyển khoản VietQR
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="text-sm space-y-2">
                  <div>
                    <div className="text-gray-500">Ngân hàng</div>
                    <div className="font-semibold text-gray-900">
                      {rechargeInfo.bank?.bankCode || "BIDV"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Số tài khoản</div>
                    <div className="font-semibold text-gray-900">
                      {rechargeInfo.bank?.accountNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Chủ tài khoản</div>
                    <div className="font-semibold text-gray-900">
                      {rechargeInfo.bank?.accountName}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Số tiền</div>
                    <div className="font-semibold text-emerald-600">
                      {formatVND(rechargeInfo.amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Nội dung chuyển khoản</div>
                    <div className="font-semibold text-red-600 break-all">
                      {rechargeInfo.code}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      * Bắt buộc ghi đúng nội dung này để hệ thống tự cộng tiền vào tài khoản.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <img
                    src={rechargeInfo.qrUrl}
                    alt="Mã VietQR nạp tiền"
                    className="w-56 h-56 md:w-64 md:h-64 object-contain border border-dashed border-gray-300 rounded-xl p-3 bg-white"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Quét mã bằng ứng dụng ngân hàng để nạp tiền nhanh.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
