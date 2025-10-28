import api from "./client";

// DTO backend trả: { access_token, user: { id, email, fullName, phone, role } }

export async function loginApi({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // -> { access_token, user }
}

export async function registerApi({ email, password, fullName, phone }) {
  // Tuỳ backend: trả user hoặc message. Ở đây giả định trả user đã tạo.
  const { data } = await api.post("/auth/register", {
    email, password, fullName, phone
  });
  return data;
}
