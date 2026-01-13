// src/containers/Admin/AdminUserManage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../Public/AuthContext.jsx";
import AdminPageLayout from "./AdminPageLayout.jsx";

// Base URL cho API (env trước, localhost sau)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function EmptyState() {
  return <div className="text-sm text-gray-500">Không tìm thấy tài khoản.</div>;
}

const ROLE_LABEL = {
  0: "Người thuê trọ (0)",
  1: "Người cho thuê (1)",
  2: "Quản trị viên (2)",
  3: "Vô hiệu hóa (3)",
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setEditUser({ name: "", phone: "", password: "", role: 0, money: 0 });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser({
      id: u.id,
      name: u.name,
      phone: u.phone,
      password: "",
      role: Number(u.role ?? 0),
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
      const res = await fetch(`${API_BASE}/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

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
    <AdminPageLayout activeKey="users">
      <main className="py-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
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
                className="px-3 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e2e]/40"
              />
              <button
                className="px-4 py-2 bg-[#ff5e2e] text-white rounded-full text-sm shadow-sm hover:bg-[#ff4a1a] transition"
                type="submit"
              >
                Tìm
              </button>
            </form>

            <button
              onClick={openCreate}
              className="px-4 py-2 bg-green-500 text-white rounded-full text-sm shadow-sm hover:bg-green-600 transition"
            >
              Thêm tài khoản
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100/60">
          {loading && (
            <div className="text-sm text-gray-500">Đang tải danh sách...</div>
          )}
          {err && <div className="text-sm text-red-500 mb-2">{err}</div>}
          {!loading && users.length === 0 && <EmptyState />}

          {users.length > 0 && (
            <div className="space-y-2">
              {users.map((u, idx) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white to-[#fff7f2] hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ffede1] flex items-center justify-center text-xs font-semibold text-[#ff5e2e]">
                      {idx + 1}
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900">
                        {u.name || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {u.phone} • Vai trò: {ROLE_LABEL[Number(u.role)] ?? u.role} •
                        Số dư: {Number(u.money).toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => confirmDelete(u)}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition"
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
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white rounded-2xl w-[520px] p-6 z-10 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editUser?.id ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">Số điện thoại</label>
                <input
                  value={editUser.phone}
                  onChange={(e) =>
                    setEditUser({ ...editUser, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e2e]/40"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Tên</label>
                <input
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e2e]/40"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">
                  Mật khẩu{" "}
                  <span className="text-xs text-gray-400">
                    ({editUser.id ? "để trống không đổi" : "bắt buộc"})
                  </span>
                </label>
                <input
                  value={editUser.password}
                  onChange={(e) =>
                    setEditUser({ ...editUser, password: e.target.value })
                  }
                  type="password"
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e2e]/40"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Vai trò</label>
                <select
                  value={Number(editUser.role)}
                  onChange={(e) =>
                    setEditUser({
                      ...editUser,
                      role: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e2e]/40"
                >
                  <option value={0}>Người thuê trọ (0)</option>
                  <option value={1}>Người cho thuê (1)</option>
                  <option value={2}>Quản trị viên (2)</option>
                  <option value={3}>Vô hiệu hóa (3)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Số dư (money)</label>
                <input
                  value={editUser.money}
                  onChange={(e) =>
                    setEditUser({ ...editUser, money: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e2e]/40"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-full text-sm"
              >
                Hủy
              </button>
              <button
                onClick={saveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
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
            className="absolute inset-0 bg-black/30"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="bg-white rounded-2xl p-6 z-50 w-[420px] shadow-xl">
            <h3 className="font-semibold mb-3">Xác nhận xóa</h3>
            <p>
              Bạn có chắc chắn muốn xoá tài khoản{" "}
              <strong>{deletingUser?.phone}</strong> ?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 border rounded-full text-sm"
              >
                Hủy
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
