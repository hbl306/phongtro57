import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminHeader from "../../components/layout/AdminHeader.jsx";
import { useAuth } from "../Public/AuthContext.jsx";

const TABS = [
  { key: "pending", label: "Bài đăng chưa duyệt" },
  { key: "reported", label: "Bài đăng bị báo xấu" },
];

export default function AdminPostManage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Nếu không phải admin thì quay về /
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
        const res = await fetch("http://localhost:5000/api/admin/posts", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Không tải được danh sách bài đăng");

        // Backend trả dạng: { success: true, data: [...] }
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
      const res = await fetch(`http://localhost:5000/api/admin/posts/${postId}/approve`, {
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
      const res = await fetch(`http://localhost:5000/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Xoá bài đăng thất bại");

      setPendingPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
    } catch (e) {
      alert(e.message);
    }
  };

  /* =================== UI LIST =================== */
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
              <div className="flex-1">
                <Link
                  to={`/bai-dang/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  {post.title || "Không có tiêu đề"}
                </Link>
                <div className="mt-1 text-xs text-gray-500 space-x-2">
                  {post.address && <span>{post.address}</span>}
                  {post.price && (
                    <span>
                      • {Number(post.price).toLocaleString("vi-VN")}đ/tháng
                    </span>
                  )}
                  {post.createdAt && (
                    <span>• {new Date(post.createdAt).toLocaleString("vi-VN")}</span>
                  )}
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

  const renderReportedList = () => {
    return (
      <div className="text-sm text-gray-500">
        Chức năng bài đăng báo xấu sẽ được phát triển sau.
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9efe4]">
      <AdminHeader />

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Quản lý bài đăng</h1>
          <p className="text-sm text-gray-600 mt-1">
            Duyệt bài mới, xử lý bài bị báo xấu và quản lý nội dung.
          </p>
        </div>

        {/* Tabs */}
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
            {activeTab === "reported" && renderReportedList()}
          </div>
        </div>
      </main>
    </div>
  );
}
