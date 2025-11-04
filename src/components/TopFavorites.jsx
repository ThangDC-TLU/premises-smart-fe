// src/components/TopFavorites.jsx
import { Card, List, Tag, Empty, Typography } from "antd";
import { Link } from "react-router-dom";
import { getAllFavorites } from "../utils/favorites";

const { Paragraph } = Typography;

const PLACEHOLDER_IMG =
  "https://cdn.jsdelivr.net/gh/vanhung4499/cdn-placeholders/placeholder-600x360.png";

/**
 * Props (tùy chọn)
 * - title?: string
 * - emptyText?: string
 * - limit?: number
 * - getListingMeta?: (id: string|number) => { title?: string, img?: string, href?: string }
 * - onItemClick?: (id: string|number) => void
 */
export default function TopFavorites({
  title = "Nổi bật (yêu thích nhiều)",
  emptyText = "Chưa có lượt yêu thích",
  limit = 5,
  getListingMeta,
  onItemClick,
}) {
  const normalizeFavorites = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .filter((x) => x && x.id != null)
        .map((x) => ({ id: x.id, count: Number(x.count) || 0 }));
    }
    return Object.entries(raw).map(([id, count]) => ({
      id,
      count: Number(count) || 0,
    }));
  };

  const favs = normalizeFavorites(getAllFavorites())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(0, limit));

  if (favs.length === 0) {
    return (
      <Card title={title}>
        <Empty description={emptyText} />
      </Card>
    );
  }

  return (
    <Card title={title}>
      <List
        itemLayout="vertical"
        dataSource={favs}
        renderItem={(it) => {
          const meta =
            (typeof getListingMeta === "function" && getListingMeta(it.id)) || {};
          const safeTitle = meta.title || `Mặt bằng #${it.id}`;
          const safeImg = meta.img || PLACEHOLDER_IMG;
          const href = meta.href || `/listing/${it.id}`;

          const Content = (
            <div
              onClick={() => onItemClick && onItemClick(it.id)}
              style={{ cursor: onItemClick ? "pointer" : "default" }}
            >
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
                  src={safeImg}
                  alt={safeTitle}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMG;
                  }}
                />
              </div>
              <Paragraph
                style={{ marginBottom: 0, fontWeight: 600 }}
                ellipsis={{ rows: 2, tooltip: safeTitle }}
              >
                {safeTitle}
              </Paragraph>
            </div>
          );

          return (
            <List.Item
              key={it.id}
              extra={
                <Tag color="red" style={{ fontSize: 12 }}>
                  ❤ {it.count}
                </Tag>
              }
            >
              {href ? <Link to={href}>{Content}</Link> : Content}
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
