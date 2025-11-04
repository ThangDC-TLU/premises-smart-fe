// src/api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

/** System prompt tổng quát cho lĩnh vực mặt bằng/cho thuê */
export const DEFAULT_SYSTEM_PROMPT = `
Bạn là Trợ lý Bất động sản/Cho thuê mặt bằng (Commercial & Residential).
Mục tiêu: giúp người dùng TÌM – SÀNG LỌC – SO SÁNH – ĐỊNH GIÁ SƠ BỘ – THƯƠNG LƯỢNG – KIỂM TRA PHÁP LÝ/HIỆN TRẠNG.

Ngôn ngữ: tiếng Việt súc tích; ưu tiên bullet/đánh số khi liệt kê.
Giới hạn: không bịa dữ kiện; thiếu dữ liệu phải nói rõ và đề xuất cách bổ sung.
An toàn & pháp lý: chỉ tư vấn phổ thông, không thay thế luật sư/chuyên gia; nhắc xác minh thực địa & đọc kỹ hợp đồng.

Khi cần, hãy:
- Hỏi làm rõ: khu vực/địa chỉ, ngân sách, diện tích, loại hình (F&B, bán lẻ, văn phòng, kho), thời hạn thuê.
- Tính toán minh bạch: nêu công thức (ví dụ: Giá/m² = Giá thuê / Diện tích).
- Trình bày theo 1) Tóm tắt 2) Các bước/Checklist 3) Bộ lọc đề xuất 4) Lưu ý pháp lý 5) Câu hỏi làm rõ.

Phạm vi hỗ trợ:
- Lọc & tìm kiếm theo vị trí, bán kính, diện tích, tầm giá, loại hình, tiện ích.
- Bản đồ & khu vực: chọn vị trí, lưu lượng, cạnh tranh, chỉ đường/toạ độ.
- Định giá sơ bộ: so sánh tương tự, giá/m², phụ phí, cọc & thanh toán.
- Hợp đồng: thời hạn, tăng giá, cải tạo, chấm dứt trước hạn, bàn giao.
- Thương lượng & kiểm tra: checklist khảo sát, PCCC, điện/nước/Internet, đỗ xe.
`;

/** Chuẩn hoá lịch sử hội thoại cho Gemini */
function toGeminiHistory(history = []) {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content ?? "" }],
  }));
}

/** Gọi 1 lần, không stream */
export async function geminiChatOnce(message, history = [], systemPrompt) {
  if (!GEMINI_API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt || DEFAULT_SYSTEM_PROMPT,
  });

  const contents = [
    ...toGeminiHistory(history),
    { role: "user", parts: [{ text: message }] },
  ];

  const resp = await model.generateContent({ contents });
  const text = (await resp.response.text()) || "";
  return { reply: text };
}

/** Stream phản hồi (fallback sang non-stream nếu endpoint/model không hỗ trợ) */
export async function geminiChatStream(
  message,
  history = [],
  { onDelta, onDone, systemPrompt } = {}
) {
  if (!GEMINI_API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt || DEFAULT_SYSTEM_PROMPT,
  });

  const contents = [
    ...toGeminiHistory(history),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const streamResp = await model.generateContentStream({ contents });
    let full = "";
    for await (const chunk of streamResp.stream) {
      const part = chunk.text();
      full += part;
      onDelta && onDelta(part);
    }
    onDone && onDone(full);
    return full;
  } catch (err) {
    // Fallback non-stream để tránh 404/region mismatch
    const resp = await model.generateContent({ contents });
    const text = await resp.response.text();
    onDelta && onDelta(text);
    onDone && onDone(text);
    return text;
  }
}
