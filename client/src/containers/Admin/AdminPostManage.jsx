// src/containers/Admin/AdminPostManage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Public/AuthContext.jsx";
import AdminPageLayout from "./AdminPageLayout.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TABS = [
  { key: "pending", label: "Bài đăng chưa duyệt" },
  { key: "reported", label: "Bài đăng bị báo xấu" },
];

const REPORT_TABS = [
  { key: "new", label: "Chưa xử lý" },
  { key: "resolved", label: "Đã xử lý" },
];

const REASON_LABEL = {
  fraud: "Tin có dấu hiệu lừa đảo",
  duplicate: "Tin trùng lặp nội dung",
  cant_contact: "Không liên hệ được chủ tin đăng",
  incorrect_info: "Thông tin không đúng thực tế",
  other: "Lý do khác",
};

export default function AdminPostManage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");

  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [reportTab, setReportTab] = useState("new");
  const [reportedGroups, setReportedGroups] = useState([]);
  const [loadingReported, setLoadingReported] = useState(false);
  const [errReported, setErrReported] = useState("");

  useEffect(() => {
    if (!user || Number(user.role) !== 2) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* =================== LẤY LIST BÀI PENDING =================== */
  useEffect(() => {
    if (activeTab !== "pending") return;

    const fetchPending = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`${API_BASE}/api/admin/posts`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Không tải được danh sách bài đăng");

        setPendingPosts(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [activeTab, token]);

  /* =================== DUYỆT BÀI =================== */
  const approvePost = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/posts/${postId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Duyệt bài thất bại");

      setPendingPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
    } catch (e) {
      alert(e.message);
    }
  };

  /* =================== XOÁ BÀI =================== */
  const rejectPost = async (postId) => {
    const ok = window.confirm("Bạn chắc chắn muốn từ chối và xoá bài đăng này?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Xoá bài đăng thất bại");

      setPendingPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
      setReportedGroups((prev) => prev.filter((g) => (g.postId || g.post?.id) !== postId));
    } catch (e) {
      alert(e.message);
    }
  };

  /* =================== LẤY LIST REPORTED (new/resolved) =================== */
  useEffect(() => {
    if (activeTab !== "reported") return;

    const fetchReported = async () => {
      setLoadingReported(true);
      setErrReported("");

      try {
        const res = await fetch(`${API_BASE}/api/admin/reports?status=${reportTab}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Không tải được danh sách báo xấu");

        setReportedGroups(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setErrReported(e.message);
      } finally {
        setLoadingReported(false);
      }
    };

    fetchReported();
  }, [activeTab, reportTab, token]);

  /* =================== ẨN BÀI + RESOLVE REPORT =================== */
  const hideReportedPost = async (postId) => {
    const ok = window.confirm("Ẩn bài đăng này và đánh dấu báo xấu là đã xử lý?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/reports/${postId}/hide`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Ẩn bài thất bại");

      setReportedGroups((prev) => prev.filter((g) => (g.postId || g.post?.id) !== postId));
    } catch (e) {
      alert(e.message);
    }
  };

  /* =================== UI LIST PENDING =================== */
  const renderPendingList = () => {
    if (loading) return <p className="text-sm text-gray-500">Đang tải danh sách…</p>;
    if (err) return <p className="text-sm text-red-500">Lỗi: {err}</p>;

    if (!pendingPosts.length) {
      return <p className="text-sm text-gray-500">Hiện không có bài đăng nào đang chờ duyệt.</p>;
    }

    return (
      <div className="space-y-3">
        {pendingPosts.map((post) => {
          const id = post.id || post._id;
          return (
            <div
              key={id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/bai-dang/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:underline line-clamp-1"
                >
                  {post.title || "Không có tiêu đề"}
                </Link>

                <div className="mt-1 text-xs text-gray-500 space-x-2">
                  {post.address && <span>{post.address}</span>}
                  {post.price && <span>• {Number(post.price).toLocaleString("vi-VN")}đ/tháng</span>}
                  {post.createdAt && <span>• {new Date(post.createdAt).toLocaleString("vi-VN")}</span>}
                </div>

                {post.ownerName && (
                  <div className="mt-1 text-xs text-gray-500">
                    Người đăng: <b>{post.ownerName}</b>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approvePost(id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Duyệt bài
                </button>
                <button
                  onClick={() => rejectPost(id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-500 hover:bg-red-600 text-white"
                >
                  Từ chối
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* =================== UI LIST REPORTED =================== */
  const renderReportedList = () => {
    if (loadingReported) return <p className="text-sm text-gray-500">Đang tải báo xấu…</p>;
    if (errReported) return <p className="text-sm text-red-500">Lỗi: {errReported}</p>;

    if (!reportedGroups.length) {
      return (
        <p className="text-sm text-gray-500">
          {reportTab === "new" ? "Hiện chưa có báo xấu mới." : "Hiện chưa có báo xấu đã xử lý."}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {reportedGroups.map((g) => {
          const postId = g.postId || g.post?.id;
          const post = g.post || {};
          const reports = Array.isArray(g.reports) ? g.reports : [];

          return (
            <div key={postId} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/bai-dang/${postId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline line-clamp-1"
                  >
                    {post.title || "Không có tiêu đề"}
                  </Link>

                  <div className="mt-1 text-xs text-gray-500 space-x-2">
                    {post.address && <span>{post.address}</span>}
                    {post.price && <span>• {Number(post.price).toLocaleString("vi-VN")}đ/tháng</span>}
                    {post.createdAt && <span>• {new Date(post.createdAt).toLocaleString("vi-VN")}</span>}
                    {post.status && <span>• Trạng thái: <b>{post.status}</b></span>}
                  </div>

                  <div className="mt-3 space-y-2">
                    {reports.map((r) => (
                      <div key={r.id} className="text-xs text-gray-700 border-l-2 border-orange-200 pl-3">
                        <div>
                          <b>Lý do:</b> {REASON_LABEL[r.reason] || r.reason}
                        </div>
                        {r.description && (
                          <div className="mt-0.5">
                            <b>Mô tả:</b> {r.description}
                          </div>
                        )}
                        <div className="mt-0.5 text-gray-500">
                          <b>Người báo:</b> {r.reporterName} • {r.reporterPhone}
                          {r.createdAt ? ` • ${new Date(r.createdAt).toLocaleString("vi-VN")}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {reportTab === "new" && (
                    <button
                      onClick={() => hideReportedPost(postId)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-800 hover:bg-black text-white"
                    >
                      Ẩn bài
                    </button>
                  )}

                  <button
                    onClick={() => rejectPost(postId)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AdminPageLayout activeKey="posts">
      <main className="max-w-[1200px] mx-auto px-0 py-2">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Quản lý bài đăng</h1>
          <p className="text-sm text-gray-600 mt-1">
            Duyệt bài mới, xử lý bài bị báo xấu và quản lý nội dung.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex gap-4 border-b px-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={
                  "py-3 text-sm font-semibold border-b-2 -mb-px transition px-1 " +
                  (activeTab === tab.key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-orange-500")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "pending" && renderPendingList()}

            {activeTab === "reported" && (
              <>
                <div className="flex gap-2 mb-4">
                  {REPORT_TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setReportTab(t.key)}
                      className={
                        "px-3 py-1.5 text-xs font-semibold rounded-full border transition " +
                        (reportTab === t.key
                          ? "border-orange-500 text-orange-600 bg-orange-50"
                          : "border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600")
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {renderReportedList()}
              </>
            )}
          </div>
        </div>
      </main>
    </AdminPageLayout>
  );
}
