import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ps_token") || localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const res = error?.response;
    let msg = "Có lỗi xảy ra";

    if (res) {
      const { status, data } = res;

      // <-- QUAN TRỌNG: backend trả text "Sai email hoặc mật khẩu!"
      if (typeof data === "string" && data.trim()) {
        msg = data.trim();
      } else if (data && typeof data === "object") {
        msg = data.message || data.error || data.detail || msg;
      } else if (status === 401) {
        msg = "Sai email hoặc mật khẩu";
      } else {
        msg = `Lỗi ${status}`;
      }
    } else if (error?.code === "ERR_NETWORK") {
      msg = "Không thể kết nối máy chủ";
    } else if (error?.message) {
      msg = error.message;
    }

    error.normalizedMessage = msg;
    return Promise.reject(error);
  }
);

export default api;
