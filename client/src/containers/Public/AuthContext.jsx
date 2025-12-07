// src/containers/Public/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Load lại khi F5
  useEffect(() => {
    const t = localStorage.getItem("pt_token");
    const u = localStorage.getItem("pt_user");
    if (t && u) {
      setToken(t);
      try {
        setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    }
    setAuthReady(true);
  }, []);

  const login = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("pt_token", token);
    localStorage.setItem("pt_user", JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("pt_token");
    localStorage.removeItem("pt_user");
  };

  // Cập nhật cục bộ (vd: money sau khi trừ phí / nạp tiền)
  const updateUser = (partial) => {
    setUser((prev) => {
      const next =
        typeof partial === "function"
          ? partial(prev || {})
          : { ...(prev || {}), ...partial };
      localStorage.setItem("pt_user", JSON.stringify(next));
      return next;
    });
  };

  // ✅ refreshUser SAFE – chỉ đọc lại từ localStorage, không gọi API
  const refreshUser = () => {
    try {
      const u = localStorage.getItem("pt_user");
      if (!u) return;
      const parsed = JSON.parse(u);
      setUser(parsed);
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({ user, token, authReady, login, logout, updateUser, refreshUser }),
    [user, token, authReady]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
