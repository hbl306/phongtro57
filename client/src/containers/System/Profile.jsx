// src/containers/System/Profile.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../Public/AuthContext.jsx";
import userService from "../../services/userService";

const ROLE_TEXT = {
  0: "Người thuê trọ",
  1: "Người cho thuê",
  2: "Quản trị viên",
};

function ProfileInfoTab({ user, updateUser }) {
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(null); // 'success' | 'error'

  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg("Tên liên hệ không được để trống.");
      setMsgType("error");
      return;
    }

    try {
      setSaving(true);
      setMsg("");
      setMsgType(null);

      await userService.updateProfile({ name: name.trim() });

      if (updateUser) updateUser({ name: name.trim() });

      setMsg("Cập nhật thông tin thành công.");
      setMsgType("success");
    } catch (err) {
      console.error("update profile error >>>", err);
      setMsg(err?.message || "Cập nhật thông tin thất bại.");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl w-full">
      {/* Header card – avatar + tên + sđt */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl text-gray-400">
          {(user?.name && user.name[0]?.toUpperCase()) ||
            (user?.phone && String(user.phone)[0]) ||
            "U"}
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {user?.name || "Chưa có tên"}
          </div>
          <div className="text-sm text-gray-500">
            {user?.phone || "Chưa có số điện thoại"}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Số điện thoại
          </label>
          <input
            type="text"
            value={user?.phone || ""}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Tên liên hệ
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            placeholder="Nhập tên liên hệ của bạn"
          />
        </div>

        {msg && (
          <p
            className={
              "text-sm " +
              (msgType === "success" ? "text-emerald-600" : "text-red-500")
            }
          >
            {msg}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
          >
            {saving ? "Đang cập nhật..." : "Cập nhật"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChangePasswordTab() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType(null);

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setMsg("Vui lòng điền đầy đủ thông tin.");
      setMsgType("error");
      return;
    }

    if (form.newPassword.length < 6) {
      setMsg("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setMsgType("error");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMsg("Xác nhận mật khẩu mới không khớp.");
      setMsgType("error");
      return;
    }

    try {
      setSaving(true);
      await userService.changePassword(form.oldPassword, form.newPassword);

      setMsg("Đổi mật khẩu thành công.");
      setMsgType("success");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("change password error >>>", err);
      setMsg(err?.message || "Đổi mật khẩu thất bại.");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl w-full">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Thay đổi mật khẩu
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Nhập mật khẩu cũ
          </label>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Nhập mật khẩu mới
          </label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          />
        </div>

        {msg && (
          <p
            className={
              "text-sm " +
              (msgType === "success" ? "text-emerald-600" : "text-red-500")
            }
          >
            {msg}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
          >
            {saving ? "Đang cập nhật..." : "Cập nhật"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChangeRoleTab({ user, logout }) {
  if (!user) return null;

  const currentRole = Number(user.role ?? 0);
  const [selectedRole, setSelectedRole] = useState(
    currentRole === 0 || currentRole === 1 ? currentRole : 0
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(null);

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  const ROLE_OPTIONS = [
    {
      value: 0,
      label: "Người thuê trọ",
      desc: "Dùng để tìm phòng, đặt cọc và quản lý phòng đã đặt.",
    },
    {
      value: 1,
      label: "Người cho thuê",
      desc: "Dùng để đăng tin cho thuê phòng và quản lý tin đăng.",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType(null);

    if (selectedRole === currentRole) {
      setMsg("Bạn đang ở đúng vai trò này rồi.");
      setMsgType("error");
      return;
    }

    if (
      !window.confirm(
        "Khi chuyển vai trò, bạn sẽ bị đăng xuất và cần đăng nhập lại. Tiếp tục?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      await userService.changeRole(selectedRole);

      setMsg("Đổi vai trò thành công. Hệ thống sẽ đăng xuất tài khoản.");
      setMsgType("success");

      setTimeout(() => {
        logout && logout();
      }, 500);
    } catch (err) {
      console.error("change role error >>>", err);
      setMsg(err?.message || "Đổi vai trò thất bại.");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = currentRole === 2;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl w-full">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Đổi vai trò tài khoản
      </h2>

      <p className="text-sm text-gray-700 mb-3">
        Vai trò hiện tại:{" "}
        <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-medium text-xs">
          {ROLE_TEXT[currentRole] || "Không xác định"}
        </span>
      </p>

      {isAdmin ? (
        <p className="text-sm text-red-500">
          Tài khoản quản trị viên không thể đổi vai trò từ giao diện này.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Bạn có muốn chuyển sang vai trò khác? Chọn vai trò bên dưới:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedRole(opt.value)}
                  className={
                    "text-left rounded-xl border px-4 py-3 text-sm transition " +
                    (selectedRole === opt.value
                      ? "border-orange-400 bg-orange-50 shadow-sm"
                      : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40")
                  }
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {opt.label}
                    </span>
                    <span
                      className={
                        "h-4 w-4 rounded-full border flex items-center justify-center text-[10px] " +
                        (selectedRole === opt.value
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-300 text-transparent")
                      }
                    >
                      ●
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {msg && (
            <p
              className={
                "text-sm " +
                (msgType === "success" ? "text-emerald-600" : "text-red-500")
              }
            >
              {msg}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || selectedRole === currentRole}
              className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
            >
              {saving
                ? "Đang cập nhật..."
                : "Cập nhật vai trò và đăng xuất"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AccountProfile() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'password' | 'role'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Quản lý tài khoản
        </h1>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 bg-[#f5f5f7]">
        <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "info"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "password"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Đổi mật khẩu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("role")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "role"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Đổi vai trò
          </button>
        </div>
      </div>

      {/* Content – căn giữa giống phongtro123 */}
      <div className="px-6 pb-10 pt-6 flex-1 overflow-auto bg-[#f5f5f7]">
        <div className="max-w-3xl mx-auto flex justify-center">
          {activeTab === "info" && (
            <ProfileInfoTab user={user} updateUser={updateUser} />
          )}
          {activeTab === "password" && <ChangePasswordTab />}
          {activeTab === "role" && (
            <ChangeRoleTab user={user} logout={logout} />
          )}
        </div>
      </div>
    </div>
  );
}
