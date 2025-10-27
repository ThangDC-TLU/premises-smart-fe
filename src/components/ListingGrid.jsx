import { useMemo, useState } from "react";
import { Row, Col, Card, Tag, Typography, Pagination, Space } from "antd"; // ⬅️ bỏ Paragraph ở đây
import { EnvironmentOutlined, AreaChartOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Title, Text, Paragraph } = Typography; // ⬅️ lấy Paragraph từ Typography

/* Mock data để xem UI – sau này thay bằng props từ API */
const MOCK = Array.from({ length: 24 }).map((_, i) => {
  const id = `L${String(i + 1).padStart(3, "0")}`;
  const area = [30, 45, 60, 80, 100, 120][i % 6];
  const price = [8000000, 12000000, 18000000, 25000000, 35000000, 50000000][i % 6];
  const type = ["F&B", "Văn phòng", "Bán lẻ", "Kho bãi"][i % 4];
  const city = ["Hà Nội", "TP. HCM", "Đà Nẵng"][i % 3];
  const district = ["Q.1", "Q.3", "Q.7", "Cầu Giấy", "Thanh Xuân"][i % 5];
  return {
    id,
    title: `${type} – ${area}m², ${district}`,
    price,
    area_m2: area,
    businessType: type,
    address: `${district}, ${city}`,
    img: `https://picsum.photos/seed/${id}/900/600`,
  };
});

const currency = (n) => (n || 0).toLocaleString("vi-VN") + " đ/tháng";

export default function ListingGrid({ items = MOCK, pageSize = 12, title = "Cho thuê mặt bằng kinh doanh" }) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageData = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  return (
    <div>
      <Title level={2} style={{ marginBottom: 4 }}>{title}</Title>
      <Text type="secondary">Hiện có <b>{total}</b> kết quả trên tổng số <b>{Math.max(1, Math.ceil(total / pageSize))}</b> trang.</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
        {pageData.map((it) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={it.id}>
            <Card
              hoverable
              cover={
                <Link to={`/listing/${it.id}`}>
                  <img src={it.img} alt={it.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                </Link>
              }
            >
              <Link to={`/listing/${it.id}`}>
                <Title level={5} style={{ marginBottom: 6, minHeight: 44 }}>{it.title}</Title>
              </Link>
              <Space wrap size="small" style={{ marginBottom: 6 }}>
                <Tag color="red">{currency(it.price)}</Tag>
                <Tag icon={<AreaChartOutlined />}>{it.area_m2} m²</Tag>
                <Tag>{it.businessType}</Tag>
              </Space>
              <div style={{ color: "#8c8c8c" }}>
                <EnvironmentOutlined /> {it.address}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p) => setPage(p)} showSizeChanger={false} />
      </div>
    </div>
  );
}
