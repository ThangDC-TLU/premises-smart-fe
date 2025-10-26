import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Row, Col, Card, Breadcrumb, Typography, Tag, Rate, Space, Button, Divider,
  Carousel, Descriptions, Avatar, List, Skeleton, Modal, Form, Input, message
} from "antd";
import {
  HomeOutlined, EnvironmentOutlined, TagOutlined, AreaChartOutlined,
  PhoneOutlined, MessageOutlined, ShareAltOutlined, ThunderboltOutlined,
  HeartOutlined, HeartFilled
} from "@ant-design/icons";
import { getFavoriteCount, addFavorite } from "../utils/favorites";

const { Title, Paragraph, Text } = Typography;

// Mock data để xem UI (chưa nối BE)
const mockListing = (id) => ({
  id,
  title: "Mặt bằng góc 2 mặt tiền, phù hợp F&B - Quận 1",
  price: 35000000,
  area_m2: 75,
  businessType: "F&B",
  address: "123 Lê Lợi, Q.1, TP.HCM",
  rating: 4.5,
  images: [
    "https://picsum.photos/seed/ps1/1200/700",
    "https://picsum.photos/seed/ps2/1200/700",
    "https://picsum.photos/seed/ps3/1200/700",
  ],
  amenities: ["Gần trung tâm", "Có chỗ để xe", "Mặt tiền rộng", "Sàn gỗ"],
  description:
    "Mặt bằng góc 2 mặt tiền, tầm nhìn thoáng, lưu lượng người qua lại cao. Phù hợp mở quán cà phê / ăn nhanh. Hợp đồng dài hạn, cọc 2 tháng.",
  createdAt: "2025-10-10",
  owner: { name: "Anh Minh", phone: "0901 234 567", avatar: "https://i.pravatar.cc/80?img=15" },
  similar: [
    { id: "s1", title: "MT Q.3, 60m², phù hợp bán lẻ", price: 22000000, area_m2: 60, img:"https://picsum.photos/seed/s1/600/360" },
    { id: "s2", title: "Văn phòng Q. Phú Nhuận, 90m²", price: 28000000, area_m2: 90, img:"https://picsum.photos/seed/s2/600/360" },
    { id: "s3", title: "Kho Q.7, 120m², xe tải vào", price: 18000000, area_m2: 120, img:"https://picsum.photos/seed/s3/600/360" },
  ],
});

export default function ListingDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    const t = setTimeout(() => {
      const mock = mockListing(id || "demo");
      setData(mock);
      setFavCount(getFavoriteCount(mock.id));
    }, 400);
    return () => clearTimeout(t);
  }, [id]);

  if (!data) {
    return (
      <div style={{ maxWidth: 1200, margin: "16px auto", padding: "0 16px" }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "16px auto", padding: "0 16px" }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: "Chi tiết tin" },
          { title: data.title.length > 28 ? data.title.slice(0,28) + "…" : data.title },
        ]}
        style={{ marginBottom: 12 }}
      />

      <Row gutter={16} align="top">
        {/* LEFT */}
        <Col xs={24} lg={16}>
          <Card bordered>
            {/* Carousel Ảnh */}
            <Carousel arrows autoplay>
              {data.images.map((src, i) => (
                <div key={i}>
                  <img src={src} alt={`img-${i}`} style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 6 }} />
                </div>
              ))}
            </Carousel>

            {/* Tiêu đề + Thông tin nhanh */}
            <div style={{ marginTop: 16 }}>
              <Title level={3} style={{ marginBottom: 4 }}>{data.title}</Title>
              <Space wrap size="small">
                <Tag color="red">{data.price.toLocaleString()} đ/tháng</Tag>
                <Tag icon={<AreaChartOutlined />}>{data.area_m2} m²</Tag>
                <Tag icon={<TagOutlined />}>{data.businessType}</Tag>
                <Tag icon={<EnvironmentOutlined />}>{data.address}</Tag>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Rate allowHalf disabled defaultValue={data.rating} />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {data.rating} · Đăng ngày {data.createdAt}
                </Text>
              </div>
            </div>

            <Divider />

            {/* Mô tả */}
            <Title level={4}>Mô tả</Title>
            <Paragraph>{data.description}</Paragraph>

            {/* Tiện ích */}
            <Title level={4} style={{ marginTop: 16 }}>Tiện ích</Title>
            <Space size={[8,8]} wrap>
              {data.amenities.map((a) => (
                <Tag key={a} color="green">{a}</Tag>
              ))}
            </Space>

            <Divider />

            {/* Thông tin chi tiết */}
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              size="middle"
              items={[
                { key: "1", label: "Giá thuê", children: `${data.price.toLocaleString()} đ/tháng` },
                { key: "2", label: "Diện tích", children: `${data.area_m2} m²` },
                { key: "3", label: "Loại hình", children: data.businessType },
                { key: "4", label: "Địa chỉ", children: data.address },
              ]}
            />

            <Divider />

            {/* Bản đồ (giả lập ảnh) */}
            <Title level={4} style={{ marginBottom: 8 }}>Vị trí trên bản đồ</Title>
            <div
              style={{
                height: 260, border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden",
                background: "#fafafa", position: "relative",
              }}
            >
              <img
                src="https://tile.openstreetmap.org/12/3300/2150.png"
                alt="map"
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.95)" }}
              />
              <Button type="primary" size="small" style={{ position: "absolute", right: 12, bottom: 12 }}>
                Mở bản đồ
              </Button>
            </div>
          </Card>
        </Col>

        {/* RIGHT */}
        <Col xs={24} lg={8}>
          {/* Chủ tin + nút hành động */}
          <Card>
            <Space align="start">
              <Avatar size={48} src={data.owner.avatar} />
              <div>
                <Text strong>{data.owner.name}</Text>
                <div><Text type="secondary">Chủ tin đăng</Text></div>
              </div>
            </Space>

            <Space style={{ marginTop: 12 }} wrap>
              <Button type="primary" icon={<PhoneOutlined />} onClick={() => message.info(`Gọi: ${data.owner.phone}`)}>
                {data.owner.phone}
              </Button>
              <Button icon={<MessageOutlined />} onClick={() => setContactOpen(true)}>
                Nhắn tin
              </Button>
              <Button icon={<ShareAltOutlined />}>Chia sẻ</Button>
              <Button type="dashed" icon={<ThunderboltOutlined />} onClick={() => setPredictOpen(true)}>
                Dự đoán giá
              </Button>

              {/* Nút YÊU THÍCH */}
              <Button
                icon={favCount > 0 ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined />}
                onClick={() => {
                  const next = addFavorite(data.id);
                  setFavCount(next);
                }}
              >
                Yêu thích {favCount ? `(${favCount})` : ""}
              </Button>
            </Space>
          </Card>

          {/* Tin tương tự */}
          <Card title="Tin tương tự" style={{ marginTop: 16 }}>
            <List
              itemLayout="vertical"
              dataSource={data.similar}
              renderItem={(it) => (
                <List.Item key={it.id}>
                  <Link to={`/listing/${it.id}`}>
                    <img
                      src={it.img}
                      alt={it.title}
                      style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 6 }}
                    />
                    <div style={{ fontWeight: 600 }}>{it.title}</div>
                    <div style={{ color: "#8c8c8c" }}>{it.area_m2} m² · {it.price.toLocaleString()} đ/tháng</div>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal liên hệ */}
      <Modal
        title="Nhắn tin cho chủ tin"
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        okText="Gửi"
        onOk={() => {
          form.validateFields().then(() => {
            message.success("Đã gửi (demo UI)");
            setContactOpen(false);
            form.resetFields();
          });
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="message" label="Nội dung" rules={[{ required: true, message: "Nhập nội dung" }]}>
            <Input.TextArea placeholder="Xin chào, mình quan tâm mặt bằng này..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal dự đoán giá (demo) */}
      <Modal
        title="Dự đoán giá (demo UI)"
        open={predictOpen}
        onCancel={() => setPredictOpen(false)}
        footer={<Button onClick={() => setPredictOpen(false)}>Đóng</Button>}
      >
        <Paragraph>
          Dựa trên diện tích <b>{data.area_m2} m²</b> và loại hình <b>{data.businessType}</b>,
          hệ thống gợi ý khoảng giá: <b>{(data.price * 0.95).toLocaleString()} – {(data.price * 1.1).toLocaleString()} đ/tháng</b>.
        </Paragraph>
        <Text type="secondary">*Chỉ là minh hoạ giao diện, chưa gọi model.</Text>
      </Modal>
    </div>
  );
}
