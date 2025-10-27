import { Card, List, Tag, Empty, Typography } from "antd";
import { getAllFavorites } from "../utils/favorites";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

/**
 * Props (tuỳ chọn)
 * - getListingMeta?: (id: string) => { title: string, img: string, href?: string }
 *   -> dùng để map id -> thông tin thật từ store/API của bạn.
 */
export default function TopFavorites({ getListingMeta }) {
  const top = getAllFavorites().slice(0, 3); // top 5 ❤

  if (top.length === 0) {
    return (
      <Card title="Nổi bật (yêu thích nhiều)">
        <Empty description="Chưa có lượt yêu thích" />
      </Card>
    );
  }

  return (
    <Card title="Nổi bật (yêu thích nhiều)">
      <List
        itemLayout="vertical"
        dataSource={top}
        renderItem={(it) => {
          // Lấy meta thật nếu có, không thì mock để xem UI
          const meta =
            (typeof getListingMeta === "function" && getListingMeta(it.id)) ||
            {
              title: `Mặt bằng nổi bật #${it.id}`,
              img: `https://picsum.photos/seed/${encodeURIComponent(it.id)}/600/360`,
              href: `/listing/${it.id}`,
            };

          const content = (
            <>
              <div
                style={{
                  width: "100%",
                  height: 160,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#f5f5f5",
                  marginBottom: 8,
                  border: "1px solid #f0f0f0",
                }}
              >
                <img
                  src={meta.img}
                  alt={meta.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  loading="lazy"
                />
              </div>
              <Paragraph
                style={{ marginBottom: 0, fontWeight: 600 }}
                ellipsis={{ rows: 2, tooltip: meta.title }}
              >
                {meta.title}
              </Paragraph>
            </>
          );

          return (
            <List.Item key={it.id} extra={<Tag color="red">❤ {it.count}</Tag>}>
              {meta.href ? <Link to={meta.href}>{content}</Link> : content}
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
