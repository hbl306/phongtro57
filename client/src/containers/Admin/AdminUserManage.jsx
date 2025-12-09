// src/containers/Admin/AdminUserManage.jsx
import { useEffect, useState } from "react";
import AdminHeader from "../../components/layout/AdminHeader.jsx";
import { useAuth } from "../Public/AuthContext.jsx";

// 👇 Base URL cho API (env trước, localhost sau, bỏ dấu / ở cuối nếu có)
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

function EmptyState() {
  return (
    <div className="text-sm text-gray-500 text-center py-6">
      Không tìm thấy tài khoản.
    </div>
  );
}

export default function AdminUserManage() {
  const { token } = useAuth();
  const [qPhone, setQPhone] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [editUser, setEditUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [deletingUser, setDeletingUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchList();
  }, [token]);

  const fetchList = async (phone) => {
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/admin/users`);
      if (phone) url.searchParams.set("phone", phone);
      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không tải được danh sách");
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    fetchList(qPhone.trim());
  };

  const openCreate = () => {
    setEditUser({
      name: "",
      phone: "",
      password: "",
      role: 0,
      money: 0,
    });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser({
      id: u.id,
      name: u.name,
      phone: u.phone,
      password: "",
      role: u.role,
      money: u.money,
    });
    setShowModal(true);
  };

  const saveUser = async () => {
    try {
      const payload = {
        name: editUser.name,
        phone: editUser.phone,
        role: Number(editUser.role),
        money: Number(editUser.money),
      };
      if (editUser.password) payload.password = editUser.password;

      const isNew = !editUser.id;
      const url = isNew
        ? `${API_BASE}/api/admin/users`
        : `${API_BASE}/api/admin/users/${editUser.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Lưu thất bại");

      setShowModal(false);
      fetchList(qPhone.trim());
    } catch (e) {
      alert(e.message);
    }
  };

  const confirmDelete = (u) => {
    setDeletingUser(u);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${deletingUser.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Xoá thất bại");
      setConfirmOpen(false);
      setDeletingUser(null);
      fetchList(qPhone.trim());
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6eee6]">
      <AdminHeader />

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Quản lý Người dùng
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Xem, tạo, chỉnh sửa và xoá tài khoản người dùng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={onSearch} className="flex items-center gap-2">
              <input
                value={qPhone}
                onChange={(e) => setQPhone(e.target.value)}
                placeholder="Tìm theo số điện thoại"
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-300 outline-none"
              />
              <button className="px-4 py-2 bg-[#ff6a3d] text-white rounded-lg shadow-sm hover:bg-[#ff5526] transition">
                Tìm
              </button>
            </form>

            <button
              onClick={openCreate}
              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition"
            >
              Thêm tài khoản
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
          {err && <div className="text-sm text-red-500">{err}</div>}
          {!loading && users.length === 0 && <EmptyState />}

          {users.length > 0 && (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition shadow-sm"
                >
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">
                      {u.name || "—"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {u.phone} • Vai trò: {u.role} • Số dư:{" "}
                      {Number(u.money).toLocaleString()}đ
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => confirmDelete(u)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal create/edit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white rounded-2xl w-[520px] p-6 z-10 shadow-xl animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              {editUser?.id ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600">Số điện thoại</label>
                <input
                  value={editUser.phone}
                  onChange={(e) =>
                    setEditUser({ ...editUser, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Tên</label>
                <input
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">
                  Mật khẩu{" "}
                  <span className="text-gray-400">
                    ({editUser.id ? "để trống không đổi" : "bắt buộc"})
                  </span>
                </label>
                <input
                  value={editUser.password}
                  onChange={(e) =>
                    setEditUser({ ...editUser, password: e.target.value })
                  }
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Vai trò</label>
                <select
                  value={editUser.role}
                  onChange={(e) =>
                    setEditUser({
                      ...editUser,
                      role: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-300 outline-none"
                >
                  <option value={0}>Người thuê trọ (0)</option>
                  <option value={1}>Người cho thuê (1)</option>
                  <option value={2}>Quản trị viên (2)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Số dư (money)</label>
                <input
                  value={editUser.money}
                  onChange={(e) =>
                    setEditUser({ ...editUser, money: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border shadow-sm hover:bg-gray-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={saveUser}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition"
              >
                {editUser.id ? "Lưu" : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl z-50">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Xác nhận xóa
            </h3>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn xoá tài khoản{" "}
              <strong>{deletingUser?.phone}</strong> ?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border shadow-sm hover:bg-gray-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
