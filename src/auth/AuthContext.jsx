// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { loginApi, registerApi } from "../api/auth";

const AuthContext = createContext(null);
const LS_USER = "ps_user";
const LS_TOKEN = "ps_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load từ localStorage khi mở app
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(LS_USER);
      const rawToken = localStorage.getItem(LS_TOKEN);
      if (rawUser && rawToken) {
        setUser(JSON.parse(rawUser));
        setToken(rawToken);
      }
    } catch {
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_TOKEN);
    }
  }, []);

  // Helper: set vào localStorage & state
  const persistAuth = (accessToken, userObj) => {
    localStorage.setItem(LS_TOKEN, accessToken);
    localStorage.setItem(LS_USER, JSON.stringify(userObj));
    setToken(accessToken);
    setUser(userObj);
  };

  // Đăng nhập -> gọi API
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginApi({ email, password }); // { access_token, user }
      persistAuth(data.access_token, data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      // err là Error(message) đã chuẩn hoá từ loginApi
      return { ok: false, error: err.message || "Đăng nhập thất bại" };
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký -> gọi API
  const register = async ({ fullName, email, phone, password }) => {
    setLoading(true);
    try {
      const data = await registerApi({ email, password, fullName, phone });
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message || "Đăng ký thất bại" };
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TOKEN);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
