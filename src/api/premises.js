import api from "./client";

// POST /api/premises  -> trả về { id, ... }
export async function createPremises(payload) {
  const { data } = await api.post("/premises", payload);
  return data;
}
