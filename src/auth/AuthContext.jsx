import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const LS_KEY = "ps_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // đọc user từ localStorage khi load app
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) try { setUser(JSON.parse(raw)); } catch {}
  }, []);

  const login = async ({ email, password }) => {
    // DEMO: không gọi BE, chỉ giả lập
    if (!email || !password) throw new Error("Thiếu email/mật khẩu");
    const demoUser = {
      id: "u_1",
      name: email.split("@")[0],
      email,
      role: "user", // đổi "admin" nếu muốn xem dashboard admin
    };
    localStorage.setItem(LS_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
