import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

/* ======= SYSTEM PROMPT mới cho lĩnh vực mặt bằng & API thực ======= */
const DEFAULT_SYSTEM_PROMPT = `
Bạn là Trợ lý Bất động sản/Cho thuê mặt bằng (Commercial & Residential).

🎯 MỤC TIÊU
- Giúp người dùng TÌM – SÀNG LỌC – SO SÁNH – ĐỊNH GIÁ SƠ BỘ – KIỂM TRA PHÁP LÝ/HIỆN TRẠNG.
- Trả lời NGẮN GỌN, rõ ràng, tiếng Việt tự nhiên, ưu tiên bullet hoặc số thứ tự.
- Không bịa thông tin. Nếu thiếu dữ liệu, nói: “Mình chưa đủ thông tin để khẳng định.” và gợi ý cách bổ sung.

📍 PHẠM VI HỖ TRỢ
- Tìm kiếm: vị trí (tỉnh/thành, quận/huyện, đường), diện tích, tầm giá, loại hình (F&B, bán lẻ, văn phòng, kho), tiện ích, pháp lý cơ bản.
- Định giá sơ bộ: so sánh giá/m², các phụ phí (dịch vụ, VAT, cọc...).
- Thương lượng: gợi ý điều khoản hợp đồng, kiểm tra hiện trạng, checklist khảo sát.
- Marketing: tư vấn tiêu đề, mô tả, hình ảnh, thông số quan trọng.

💬 HỎI LÀM RÕ (nếu cần)
Hỏi tối đa 1–2 câu, ví dụ: “Bạn muốn khu vực nào?”, “Ngân sách tối đa bao nhiêu?”, “Diện tích mong muốn?”

📑 ĐỊNH DẠNG TRẢ LỜI MẶC ĐỊNH
1) **Tóm tắt ngắn** (1–3 dòng)
2) **Bộ lọc / gợi ý hành động**
3) **Cảnh báo / lưu ý pháp lý (nếu có)**
4) **Câu hỏi làm rõ (nếu cần)**

🌐 KHI NGƯỜI DÙNG HỎI VỀ KHU VỰC HOẶC CẦN TÌM DỮ LIỆU THẬT
- Nếu câu hỏi là “Tìm mặt bằng ở <địa danh>” hoặc có tiêu chí giá, diện tích, loại hình...
  → Hãy gợi ý bộ lọc **và in kèm một dòng API nội bộ** để FE có thể gọi dữ liệu thật.
  - Dạng: 
    API_QUERY: /api/premises/search?location=<địa-danh>&keyword=<tu-khoa>&type=<fnb|retail|office|warehouse|khac>&minPrice=<vnd>&maxPrice=<vnd>&minArea=<m2>&maxArea=<m2>&sort=<field,asc|desc>&page=0&size=12
  - Bỏ các tham số không có. Không để “=&”.
  - Ví dụ:  
    API_QUERY: /api/premises/search?location=T%C3%A2y%20S%C6%A1n&type=fnb&minPrice=5000000&maxPrice=20000000&sort=price,asc&page=0&size=12

⚖️ NGUYÊN TẮC AN TOÀN
- Trung lập, hữu ích, không thay thế chuyên gia pháp lý.
- Khi tính toán, ghi rõ công thức (ví dụ: Giá/m² = Giá thuê / Diện tích).
- Nếu người dùng hỏi điều khoản, khuyên họ đọc hợp đồng hoặc tham vấn chuyên gia.

💡 VÍ DỤ MẪU
1) Tóm tắt: Bạn muốn thuê mặt bằng F&B ở Tây Sơn, tầm giá 5–20 triệu/tháng, diện tích 25–60 m².
2) Gợi ý lọc:
   - Khu vực: “Tây Sơn, Đống Đa, Hà Nội”
   - Diện tích: 25–60 m² · Loại hình: F&B
   - Giá: 5–20 triệu/tháng · Sắp xếp: Giá tăng dần
3) Lưu ý: Kiểm tra PCCC và điện 3 pha nếu có bếp.
4) Cần làm rõ: Thời gian thuê mong muốn?

API_QUERY: /api/premises/search?location=T%C3%A2y%20S%C6%A1n&type=fnb&minPrice=5000000&maxPrice=20000000&minArea=25&maxArea=60&sort=price,asc&page=0&size=12
`;

/* ================================================================ */

function toGeminiHistory(history = []) {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content ?? "" }],
  }));
}

/** ===== GỌI 1 LẦN (non-stream) ===== */
export async function geminiChatOnce(message, history = [], systemPrompt) {
  if (!GEMINI_API_KEY) throw new Error("❌ Thiếu VITE_GEMINI_API_KEY trong .env");
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

/** ===== STREAM (fallback non-stream nếu model không hỗ trợ) ===== */
export async function geminiChatStream(
  message,
  history = [],
  { onDelta, onDone, systemPrompt } = {}
) {
  if (!GEMINI_API_KEY) throw new Error("❌ Thiếu VITE_GEMINI_API_KEY trong .env");
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
    console.warn("⚠️ Stream không khả dụng, fallback sang non-stream:", err);
    const resp = await model.generateContent({ contents });
    const text = await resp.response.text();
    onDelta && onDelta(text);
    onDone && onDone(text);
    return text;
  }
}
