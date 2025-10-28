// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client"; // axios instance có baseURL & interceptor

const AuthContext = createContext(null);
const LS_USER = "ps_user";
const LS_TOKEN = "ps_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load từ localStorage khi mở app
  useEffect(() => {
    const rawUser = localStorage.getItem(LS_USER);
    const rawToken = localStorage.getItem(LS_TOKEN);
    if (rawUser && rawToken) {
      try {
        setUser(JSON.parse(rawUser));
        setToken(rawToken);
      } catch (_) {
        localStorage.removeItem(LS_USER);
        localStorage.removeItem(LS_TOKEN);
      }
    }
  }, []);

  // Đăng nhập -> gọi BE /api/auth/login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      // backend trả { access_token, user }
      localStorage.setItem(LS_TOKEN, data.access_token);
      localStorage.setItem(LS_USER, JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      const msg = err?.response?.data || "Đăng nhập thất bại";
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký -> gọi BE /api/auth/register
  const register = async ({ fullName, email, phone, password }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        fullName, email, phone, password,
      });
      // Tùy BE, có thể chỉ trả message. Ở đây trả về để UI hiển thị.
      return { ok: true, data };
    } catch (err) {
      const msg = err?.response?.data || "Đăng ký thất bại";
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TOKEN);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
