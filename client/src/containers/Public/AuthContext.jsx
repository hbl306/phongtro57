import { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false); // ✅ thêm

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
    setAuthReady(true); // ✅ báo là đã đọc xong localStorage
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

  // ⭐ Cho phép cập nhật cục bộ (vd: money sau khi trừ phí)
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

  const value = useMemo(
    () => ({ user, token, authReady, login, logout, updateUser }),
    [user, token, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
