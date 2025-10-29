// src/api/auth.js
import api from "./client";

/**
 * Ưu tiên thông điệp đã chuẩn hoá từ axios interceptor (error.normalizedMessage).
 * Fallback sang các trường thường gặp: data.message / data.error / ...
 */
function extractMessage(err) {
  if (err?.normalizedMessage) return err.normalizedMessage;

  const res = err?.response;
  if (res) {
    const { status, data } = res;

    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data === "object") {
      return (
        data.message ||
        data.error ||
        data.detail ||
        (Array.isArray(data.errors) && data.errors[0]?.message) ||
        ""
      );
    }
    if (status === 401) return "Sai email hoặc mật khẩu";
    return `Lỗi ${status}`;
  }

  if (err?.code === "ERR_NETWORK") return "Không thể kết nối máy chủ";
  return err?.message || "Có lỗi xảy ra";
}

/**
 * Đăng nhập
 * DTO backend trả: { access_token, user: { id, email, fullName, phone, role } }
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ access_token: string, user: any }>}
 * @throws Error(message)
 */
export async function loginApi({ email, password }) {
  try {
    const { data } = await api.post(
      "/auth/login",
      { email, password },
      { headers: { Accept: "application/json" } }
    );

    if (!data?.access_token || !data?.user) {
      throw new Error("Phản hồi không hợp lệ từ máy chủ");
    }
    return data; // { access_token, user }
  } catch (err) {
    const msg = extractMessage(err) || "Đăng nhập thất bại";
    throw new Error(msg);
  }
}

/**
 * Đăng ký
 * @param {{ email: string, password: string, fullName: string, phone?: string }} payload
 * @returns {Promise<any>}  // tuỳ backend: có thể trả {message} hoặc {user}
 * @throws Error(message)
 */
export async function registerApi({ email, password, fullName, phone }) {
  try {
    const { data } = await api.post(
      "/auth/register",
      { email, password, fullName, phone },
      { headers: { Accept: "application/json" } }
    );
    return data;
  } catch (err) {
    const msg = extractMessage(err) || "Đăng ký thất bại";
    throw new Error(msg);
  }
}
