// client/src/containers/System/PaymentHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../Public/AuthContext.jsx";
import TransactionTabs from "../../components/sidebar/TransactionTabs.jsx";
import walletService from "../../services/walletService";

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
};

const ACTION_LABELS = {
  POST_CREATE: "Tạo tin đăng mới",
  POST_LABEL: "Gắn nhãn tin",
  POST_EXTEND: "Gia hạn tin",
  REFUND: "Hoàn tiền",
  RECHARGE: "Nạp tiền",
};

const ACTION_BADGE = {
  POST_CREATE: "bg-sky-50 text-sky-700 border-sky-200",
  POST_LABEL: "bg-purple-50 text-purple-700 border-purple-200",
  POST_EXTEND: "bg-indigo-50 text-indigo-700 border-indigo-200",
  REFUND: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RECHARGE: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function PaymentHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError("");
        const data = await walletService.getWalletHistory();
        if (!ignore) setRows(data);
      } catch (err) {
        if (!ignore) {
          console.error("getWalletHistory error >>>", err);
          setError(err?.message || "Không tải được lịch sử thanh toán.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [user]);

  const mappedRows = useMemo(
    () =>
      (Array.isArray(rows) ? rows : []).map((r) => {
        const change = (Number(r.amountIn) || 0) - (Number(r.amountOut) || 0);
        const isPlus = change >= 0;
        const actionKey = r.action || "";
        const label =
          ACTION_LABELS[actionKey] || r.note || "Giao dịch khác";

        return {
          ...r,
          label,
          change,
          isPlus,
        };
      }),
    [rows]
  );

  const renderRow = (row) => {
    const badgeCls =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border " +
      (ACTION_BADGE[row.action] ||
        "bg-gray-50 text-gray-600 border-gray-200");

    return (
      <div
        key={row.id}
        className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 text-sm"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={badgeCls}>{row.label}</span>
            {row.refType && (
              <span className="text-[11px] text-gray-400">
                ({row.refType})
              </span>
            )}
          </div>
          {row.note && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
              {row.note}
            </p>
          )}
          <p className="mt-0.5 text-xs text-gray-400">
            Thời gian: {formatDateTime(row.createdAt)}
          </p>
        </div>

        <div className="flex flex-col items-end text-xs flex-shrink-0 min-w-[140px]">
          <span
            className={
              "font-semibold " +
              (row.isPlus ? "text-emerald-600" : "text-red-500")
            }
          >
            {row.isPlus ? "+" : "-"}
            {formatVND(Math.abs(row.change))}
          </span>
          <span className="mt-1 text-gray-500">
            Số dư sau:{" "}
            <span className="font-medium">
              {formatVND(row.balanceAfter)}
            </span>
          </span>
        </div>
      </div>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="py-10 text-center text-sm text-gray-500">
          Đang tải lịch sử thanh toán...
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-10 text-center text-sm text-red-500">
          {error}
        </div>
      );
    }

    if (!mappedRows.length) {
      return (
        <div className="py-10 text-center text-sm text-gray-500">
          Bạn chưa có giao dịch nào trong ví.
        </div>
      );
    }

    return <div className="divide-y divide-gray-100">{mappedRows.map(renderRow)}</div>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Quản lý giao dịch
        </h1>
        <TransactionTabs active="paymentHistory" />
      </div>

      <div className="px-6 py-6 flex-1 overflow-auto">
        <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Lịch sử thanh toán / biến động số dư
            </h2>
          </div>

          {renderBody()}
        </div>
      </div>
    </div>
  );
}
