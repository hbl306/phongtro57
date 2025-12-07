// client/src/containers/System/RechargeHistory.jsx
import React, { useEffect, useState } from "react";
import TransactionTabs from "../../components/sidebar/TransactionTabs.jsx";
import walletService from "../../services/walletService.js";

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

const formatTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("vi-VN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RechargeHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await walletService.getRechargeHistory();
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("load wallet history error >>>", err);
        if (!mounted) return;
        setError(err?.message || "Không tải được lịch sử nạp tiền.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Chỉ lấy các dòng nạp tiền
  const rechargeRows = rows.filter(
    (r) => r.action === "RECHARGE"
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Quản lý giao dịch
        </h1>
        <TransactionTabs active="rechargeHistory" />
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-4 flex-1 overflow-auto bg-[#f5f5f7]">
        <div className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <p className="text-base font-semibold text-gray-900 mb-1">
            Lịch sử nạp tiền
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Ghi nhận các giao dịch nạp tiền vào ví trên hệ thống.
          </p>

          {loading && (
            <p className="text-sm text-gray-600">
              Đang tải lịch sử nạp tiền...
            </p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          {!loading && !error && rechargeRows.length === 0 && (
            <p className="text-sm text-gray-600">
              Bạn chưa có giao dịch nạp tiền nào.
            </p>
          )}

          {!loading && !error && rechargeRows.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2 pr-3">Thời gian</th>
                    <th className="text-right py-2 pr-3">Số tiền nạp</th>
                    <th className="text-right py-2 pr-3">
                      Số dư sau giao dịch
                    </th>
                    <th className="text-left py-2">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {rechargeRows.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 border-dashed border-gray-100"
                    >
                      <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">
                        {formatTime(item.createdAt)}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold text-emerald-600">
                        {formatVND(item.amountIn)}
                      </td>
                      <td className="py-2 pr-3 text-right text-gray-800">
                        {formatVND(item.balanceAfter)}
                      </td>
                      <td className="py-2 text-gray-600">
                        {item.note || "Nạp tiền VietQR"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && rechargeRows.length > 0 && (
            <p className="mt-4 text-xs text-gray-400">
              * Chỉ hiển thị các giao dịch có hành động{" "}
              <span className="font-semibold">RECHARGE</span> trong
              lịch sử ví.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
