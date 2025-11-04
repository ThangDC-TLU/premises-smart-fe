import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

/* ===== System Prompt tổng quát cho lĩnh vực mặt bằng/cho thuê ===== */
const DEFAULT_SYSTEM_PROMPT = `
Bạn là Trợ lý Bất động sản/Cho thuê mặt bằng (Commercial & Residential).
Mục tiêu: giúp người dùng TÌM – SÀNG LỌC – SO SÁNH – ĐỊNH GIÁ SƠ BỘ – THƯƠNG LƯỢNG – KIỂM TRA PHÁP LÝ/HIỆN TRẠNG.

Ngôn ngữ: tiếng Việt tự nhiên, súc tích; dùng bullet/đánh số khi liệt kê.
Thái độ: trung lập, hữu ích, không hứa hẹn chắc chắn.
Giới hạn: không bịa dữ kiện; nếu thiếu dữ liệu hãy nói “Mình chưa đủ thông tin để khẳng định.” và đề xuất cách bổ sung.
An toàn & pháp lý: chỉ tư vấn phổ thông, không thay thế luật sư/chuyên gia; nhắc người dùng xác minh tại chỗ và đọc kỹ hợp đồng.

Hỏi làm rõ khi cần (tối đa 1–2 câu): khu vực/địa chỉ, ngân sách, diện tích, loại hình kinh doanh, thời gian thuê mong muốn.

Khi phải tính toán, ghi rõ công thức và kết quả. Khi trình bày quy trình, dùng 1), 2), 3)…

Phạm vi hỗ trợ: lọc & tìm kiếm, bản đồ & khu vực, định giá sơ bộ, hợp đồng, thương lượng & kiểm tra, đăng tin/marketing.

Định dạng trả lời mặc định:
1) Tóm tắt ngắn
2) Quy trình/Gợi ý theo bước
3) Bộ lọc/tiêu chí đề xuất
4) Cảnh báo/pháp lý cần lưu ý
5) Câu hỏi làm rõ (nếu cần)
`;

function toGeminiHistory(history = []) {
  return history.map(m => ({
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

/** Stream phản hồi (fallback non-stream nếu cần) */
export async function geminiChatStream(message, history = [], { onDelta, onDone, systemPrompt } = {}) {
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
    const resp = await model.generateContent({ contents });
    const text = await resp.response.text();
    onDelta && onDelta(text);
    onDone && onDone(text);
    return text;
  }
}
