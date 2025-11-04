import { useEffect, useMemo, useRef, useState } from "react";
import { FloatButton, Drawer, Input, Button, Typography, Space, Empty, message as antdMessage } from "antd";
import { MessageOutlined, SendOutlined, LoadingOutlined, ClearOutlined } from "@ant-design/icons";
import { geminiChatStream } from "../api/gemini";

const { Text, Paragraph } = Typography;

export default function ChatbotFloating({
  storageKey = "premises_chat_history",
  title = "Trợ lý Premises Smart",
}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const listRef = useRef(null);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(history)); } catch {} }, [history, storageKey]);

  const canSend = useMemo(() => msg.trim().length > 0 && !loading, [msg, loading]);

  const scrollToBottom = () => {
    if (!listRef.current) return;
    const el = listRef.current;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  };
  useEffect(() => { scrollToBottom(); }, [open, history]);

  const clampHistory = (arr) => arr.slice(Math.max(0, arr.length - 20));

  const handleSend = async () => {
    const content = msg.trim();
    if (!content) return;

    const base = clampHistory([...history, { role: "user", content }]);
    setHistory(base);
    setMsg("");
    setLoading(true);

    // tạo placeholder assistant
    const assistantIdx = base.length;
    setHistory(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      let accumulated = "";
      await geminiChatStream(content, base, {
        onDelta: (chunk) => {
          accumulated += chunk;
          setHistory(prev => {
            const copy = [...prev];
            copy[assistantIdx] = { role: "assistant", content: accumulated };
            return copy;
          });
        },
        onDone: () => {},
        systemPrompt:
          "Bạn là Trợ lý Premises Smart (nền tảng tìm kiếm mặt bằng). " +
          "Trả lời bằng tiếng Việt, ưu tiên gạch đầu dòng khi cần. " +
          "Giải thích cách lọc theo giá/diện tích/thành phố, cách dùng bản đồ/định vị, " +
          "cách đăng tin (ảnh đầu là coverImage). Nếu câu hỏi mơ hồ, hãy hỏi lại.",
      });
    } catch (e) {
      console.error(e);
      antdMessage.error("Không thể kết nối Gemini. Kiểm tra API key hoặc mạng.");
      setHistory(prev => {
        const copy = [...prev];
        copy[assistantIdx] = { role: "assistant", content: "Có lỗi khi gọi Gemini. Vui lòng thử lại sau." };
        return copy;
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(storageKey); } catch {}
  };

  return (
    <>
      <FloatButton
        type="primary"
        shape="circle"
        tooltip="Chat với trợ lý"
        icon={<MessageOutlined />}
        onClick={() => setOpen(true)}
        style={{ right: 24, bottom: 24, zIndex: 1000 }}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        title={
          <Space style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <Text strong>{title}</Text>
            <Button size="small" icon={<ClearOutlined />} onClick={clearHistory}>
              Xóa hội thoại
            </Button>
          </Space>
        }
        styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}
      >
        {/* khung tin nhắn */}
        <div ref={listRef} style={{ flex: 1, overflow: "auto", padding: 12 }}>
          {history.length === 0 ? (
            <div style={{ paddingTop: 48 }}>
              <Empty
                description={
                  <div>
                    <div>Bạn có thể hỏi:</div>
                    <ul style={{ marginTop: 8, textAlign: "left" }}>
                      <li>“Lọc mặt bằng theo quận ở Hà Nội thế nào?”</li>
                      <li>“Mẹo đăng tin hấp dẫn?”</li>
                      <li>“Cách bật định vị để tìm gần tôi?”</li>
                    </ul>
                  </div>
                }
              />
            </div>
          ) : (
            history.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                  padding: "0 8px",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    background: m.role === "user" ? "#1677ff" : "#f5f5f5",
                    color: m.role === "user" ? "#fff" : "#000",
                    borderRadius: 12,
                    padding: "8px 12px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  <Paragraph style={{ margin: 0 }}>{m.content}</Paragraph>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", padding: "0 8px", marginBottom: 8 }}>
              <div style={{ maxWidth: "85%", background: "#f5f5f5", borderRadius: 12, padding: "8px 12px" }}>
                <Space><LoadingOutlined />Đang soạn trả lời…</Space>
              </div>
            </div>
          )}
        </div>

        {/* ô nhập */}
        <div style={{ borderTop: "1px solid #f0f0f0", padding: 12 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="Nhập câu hỏi…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={handleEnter}
              disabled={loading}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!canSend}>
              Gửi
            </Button>
          </Space.Compact>
        </div>
      </Drawer>
    </>
  );
}
