// src/containers/Admin/AdminHomeShell.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../Public/AuthContext.jsx";
import AdminPageLayout from "./AdminPageLayout.jsx";

// 👇 Base URL cho API (lấy từ .env, fallback localhost)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_DASHBOARD = {
  pendingPosts: 0,
  bookingPending: 0,
  bookingConfirmed: 0,
  totalUsers: 0,
  newUsersToday: 0,
  revenueToday: 0,
  revenueMonth: 0,
  revenueTotal: 0,
  revenueByAction: [], // [{ action, label, amount }]
  recentWallet: [], // [{ id, action, amountIn, amountOut, note, createdAt, balanceAfter }]
  recentPosts: [], // [{ id, title, status, createdAt, province, district }]
};

const ACTION_LABELS = {
  POST_CREATE: "Đăng bài mới",
  POST_LABEL: "Gắn nhãn tin VIP",
  POST_EXTEND: "Gia hạn tin",
  POST_REPOST: "Đăng lại tin",
  RECHARGE: "Nạp tiền",
  WITHDRAW: "Rút tiền",
  BOOKING: "Đặt cọc",
  REFUND: "Hoàn tiền",
  RECEIVE_DEPOSIT: "Nhận tiền cọc",
};

function formatMoney(v) {
  return `${Number(v || 0).toLocaleString("vi-VN")}đ`;
}

function formatDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminHomeShell() {
  const { user, token } = useAuth();

  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const revenueByAction = Array.isArray(dashboard.revenueByAction)
    ? dashboard.revenueByAction
    : [];

  const totalRevenueForBars = useMemo(() => {
    return revenueByAction.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [revenueByAction]);

  const loadDashboard = async () => {
    if (!token) return;

    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không tải được thống kê");

      setDashboard({
        ...DEFAULT_DASHBOARD,
        ...(data.data || {}),
      });
    } catch (e) {
      console.error("loadDashboard error >>>", e);
      setErr(e.message || "Có lỗi khi tải dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const recentWallet = Array.isArray(dashboard.recentWallet) ? dashboard.recentWallet : [];
  const recentPosts = Array.isArray(dashboard.recentPosts) ? dashboard.recentPosts : [];

  return (
    <AdminPageLayout activeKey="dashboard">
      <main className="max-w-[1200px] mx-auto px-0 py-2 space-y-6">
        {/* Header */}
        <section className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#ff7a45]">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              Xin chào, {user?.name || "Admin"} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Tổng quan nhanh về bài đăng, ví tiền và hoạt động đặt phòng.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="shrink-0 inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-800 border border-orange-100 hover:shadow-sm"
          >
            Làm mới
          </button>
        </section>

        {/* Error */}
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Top stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng doanh thu */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff7a45] via-[#ff5e2e] to-[#ff9f68] p-5 text-white shadow-md">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15" />
            <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-black/5" />
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Tổng doanh thu
            </p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(dashboard.revenueTotal)}</p>
            <p className="mt-2 text-[11px] text-white/80">
              Tổng hợp phí dịch vụ (đăng bài, gắn nhãn, gia hạn, đăng lại...)
            </p>
          </div>

          {/* Doanh thu tháng */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Doanh thu tháng này
            </p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {formatMoney(dashboard.revenueMonth)}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Hôm nay:{" "}
              <span className="font-semibold text-green-600">
                {formatMoney(dashboard.revenueToday)}
              </span>
            </p>
          </div>

          {/* Tin chờ duyệt */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Tin chờ duyệt
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {dashboard.pendingPosts || 0}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Bài đăng trạng thái <b>pending</b>.
            </p>
          </div>

          {/* Hoạt động hệ thống */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-50 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Hoạt động hệ thống
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Booking chờ xử lý:{" "}
                <span className="font-semibold text-blue-600">
                  {dashboard.bookingPending || 0}
                </span>
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Booking đã xác nhận:{" "}
                <span className="font-semibold text-emerald-600">
                  {dashboard.bookingConfirmed || 0}
                </span>
              </p>
            </div>
            <div className="mt-3 border-t border-dashed border-gray-100 pt-2">
              <p className="text-[11px] text-gray-500">
                Tổng người dùng:{" "}
                <span className="font-semibold text-gray-800">
                  {dashboard.totalUsers || 0}
                </span>{" "}
                · Mới hôm nay:{" "}
                <span className="font-semibold text-green-600">
                  {dashboard.newUsersToday || 0}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Revenue breakdown + recent wallet */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue breakdown */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-orange-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Cơ cấu doanh thu theo dịch vụ
                </h2>
                <p className="text-[11px] text-gray-500 mt-1">
                  Tỷ trọng giữa các loại phí dịch vụ.
                </p>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-medium text-orange-600">
                Tổng: {formatMoney(dashboard.revenueTotal)}
              </span>
            </div>

            {revenueByAction.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">Chưa có dữ liệu doanh thu.</p>
            ) : (
              <div className="space-y-3 mt-2">
                {revenueByAction.map((item) => {
                  const amount = Number(item.amount || 0);
                  const percent =
                    totalRevenueForBars > 0
                      ? Math.round((amount / totalRevenueForBars) * 100)
                      : 0;

                  const label =
                    item.label ||
                    ACTION_LABELS[item.action] ||
                    item.action ||
                    "Khác";

                  return (
                    <div key={item.action} className="flex items-center gap-3">
                      <div className="w-32 text-xs font-medium text-gray-700">
                        {label}
                      </div>

                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#ff9f68] via-[#ff7a45] to-[#ff5e2e]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="w-24 text-right text-xs text-gray-700">
                        {formatMoney(amount)}
                      </div>
                      <div className="w-10 text-right text-[11px] text-gray-400">
                        {percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent wallet */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-50">
            <h2 className="text-sm font-semibold text-gray-800">Giao dịch ví gần đây</h2>
            <p className="mt-1 text-[11px] text-gray-500">
              Các giao dịch nạp / trừ tiền mới nhất.
            </p>

            {recentWallet.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Chưa có giao dịch.</p>
            ) : (
              <div className="mt-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {recentWallet.map((tx) => {
                  const amountIn = Number(tx.amountIn || 0);
                  const amountOut = Number(tx.amountOut || 0);
                  const isIncome = amountIn > amountOut;
                  const net = isIncome ? amountIn : amountOut;

                  return (
                    <div
                      key={tx.id}
                      className="flex items-start justify-between rounded-xl bg-gray-50 px-3 py-2.5"
                    >
                      <div className="mr-2">
                        <div className="text-xs font-semibold text-gray-800">
                          {ACTION_LABELS[tx.action] || tx.action}
                        </div>
                        {tx.note && (
                          <div className="text-[11px] text-gray-500 line-clamp-2">
                            {tx.note}
                          </div>
                        )}
                        <div className="mt-1 text-[10px] text-gray-400">
                          {formatDateTime(tx.createdAt)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={
                            "text-xs font-semibold " +
                            (isIncome ? "text-emerald-600" : "text-red-500")
                          }
                        >
                          {isIncome ? "+" : "-"}
                          {formatMoney(net)}
                        </div>
                        <div className="mt-0.5 text-[10px] text-gray-400">
                          Số dư sau: {formatMoney(tx.balanceAfter || tx.balance_after)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent posts + user stats */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6">
          {/* Recent posts */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-orange-50">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Bài đăng mới nhất</h2>
              <p className="mt-1 text-[11px] text-gray-500">
                Một vài tin gần đây để nắm nhanh tình hình.
              </p>
            </div>

            {recentPosts.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Chưa có bài đăng.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentPosts.map((p) => (
                  <div key={p.id} className="flex items-start justify-between py-3">
                    <div className="mr-3 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {p.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {p.province} {p.district && `• ${p.district}`} ·{" "}
                        {formatDateTime(p.createdAt || p.created_at)}
                      </div>
                    </div>

                    <span
                      className={
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium " +
                        (p.status === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : p.status === "pending"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-gray-50 text-gray-500")
                      }
                    >
                      {p.status === "approved"
                        ? "Đã duyệt"
                        : p.status === "pending"
                        ? "Chờ duyệt"
                        : p.status || "Khác"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User stats */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-50">
            <h2 className="text-sm font-semibold text-gray-800">Người dùng</h2>
            <p className="mt-1 text-[11px] text-gray-500">
              Thống kê nhanh về số lượng tài khoản.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Tổng số tài khoản</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {dashboard.totalUsers || 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Tài khoản mới hôm nay</p>
                <p className="mt-1 text-lg font-semibold text-green-600">
                  +{dashboard.newUsersToday || 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/10 pointer-events-none">
            <div className="rounded-full border-4 border-white border-t-[#ff7a45] h-10 w-10 animate-spin" />
          </div>
        )}
      </main>
    </AdminPageLayout>
  );
}
