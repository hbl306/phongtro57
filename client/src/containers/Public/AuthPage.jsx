// src/containers/Public/AuthPage.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { useState } from "react";
import { validateRegister } from "../../utils/validation.js";
import { useAuth } from "./AuthContext.jsx";

// Lấy base URL cho API từ .env (VITE_API_URL) hoặc fallback về localhost khi dev
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname.includes("dang-ky");

  return (
    <div className="min-h-screen bg-[#f9efe4]">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="max-w-[680px] mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 text-center text-[22px] font-semibold">
            <NavLink
              to="/dang-nhap-tai-khoan"
              className={({ isActive }) =>
                `py-5 border-b ${isActive ? "text-gray-900" : "text-gray-400"}`
              }
              end
            >
              Đăng nhập
            </NavLink>

            <NavLink
              to="/dang-ky-tai-khoan"
              className={({ isActive }) =>
                `py-5 border-b relative ${
                  isActive ? "text-gray-900" : "text-gray-400"
                }`
              }
              end
            >
              Tạo tài khoản mới
              {isRegister && (
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-[1px] w-40 h-[3px] bg-orange-500 rounded-full" />
              )}
            </NavLink>
          </div>

          {/* Body */}
          <div className="p-8">
            {isRegister ? <RegisterForm /> : <LoginForm />}
          </div>
        </div>
      </main>
    </div>
  );
}

/* --------- components nhỏ ---------- */
function FormField({ label, type = "text", placeholder, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-[15px] text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2
                   focus:ring-orange-100 px-4 py-3 outline-none transition"
      />
    </div>
  );
}

function LoginForm() {
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone || !pw) {
      setError("Vui lòng nhập số điện thoại và mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: pw }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");

      // lưu vào context + localStorage
      login({ token: data.token, user: data.user });

      // điều hướng theo role
      const role = Number(data?.user?.role ?? 0);
      if (role === 2) navigate("/admin", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-1">
      <FormField
        label="Số điện thoại"
        placeholder="09xx xxx xxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <FormField
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <button
        disabled={loading}
        className="w-full bg-[#ff5e2e] hover:bg-[#ff4b14] text-white font-semibold py-3 rounded-full disabled:opacity-70 transition"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState(0); // 0: Người thuê trọ, 1: Người cho thuê
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errs = validateRegister({ name, phone, password: pw });
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs).join(". "));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // gửi role theo lựa chọn
        body: JSON.stringify({ name, phone, password: pw, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");

      setSuccess("Đăng ký thành công! Đang chuyển sang đăng nhập…");
      setName("");
      setPhone("");
      setPw("");

      setTimeout(() => navigate("/dang-nhap-tai-khoan"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <FormField
        label="Họ tên"
        placeholder="Nguyễn Văn A"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <FormField
        label="Số điện thoại"
        placeholder="09xx xxx xxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <FormField
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      {/* Loại tài khoản → role */}
      <div className="mt-3 mb-6">
        <div className="text-[15px] text-gray-700 mb-2">Loại tài khoản</div>

        <div className="grid grid-cols-2 gap-3">
          <label
            className={`border rounded-xl px-4 py-3 cursor-pointer transition
                             ${
                               role === 0
                                 ? "border-orange-400 bg-orange-50"
                                 : "border-gray-200 hover:bg-gray-50"
                             }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="role"
                className="accent-orange-500"
                checked={role === 0}
                onChange={() => setRole(0)}
              />
              <div>
                <div className="font-medium">Người thuê trọ</div>
                <div className="text-xs text-gray-500">Tìm & đặt phòng</div>
              </div>
            </div>
          </label>

          <label
            className={`border rounded-xl px-4 py-3 cursor-pointer transition
                             ${
                               role === 1
                                 ? "border-orange-400 bg-orange-50"
                                 : "border-gray-200 hover:bg-gray-50"
                             }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="role"
                className="accent-orange-500"
                checked={role === 1}
                onChange={() => setRole(1)}
              />
              <div>
                <div className="font-medium">Người cho thuê</div>
                <div className="text-xs text-gray-500">Đăng & quản lý tin</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {success && <p className="mb-3 text-sm text-green-600">{success}</p>}

      <button
        disabled={loading}
        className="w-full bg-[#ff5e2e] hover:bg-[#ff4b14] text-white font-semibold py-3 rounded-full disabled:opacity-70 transition"
      >
        {loading ? "Đang tạo..." : "Tạo tài khoản"}
      </button>

      <p className="mt-4 text-xs text-gray-500 leading-5">
        Qua việc đăng nhập hoặc tạo tài khoản, bạn đồng ý với các điều khoản
        sử dụng và chính sách bảo mật.
      </p>
    </form>
  );
}
