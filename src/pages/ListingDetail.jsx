// src/pages/ListingDetail.jsx
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getFavoriteCount, addFavorite } from "../utils/favorites";

const { Title, Paragraph, Text } = Typography;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8089/api";
const PLACEHOLDER_IMG = "https://picsum.photos/seed/premise/1200/700";
const PLACEHOLDER_AVATAR = "https://i.pravatar.cc/80?img=1";
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const currency = (n) => fmtVND.format(Number(n) || 0).replace("₫", "đ/tháng");

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function ListingDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [contactOpen, setContactOpen] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/premises/${id}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const normalized = {
          ...json,
          images: Array.isArray(json.images) && json.images.length ? json.images : [json.coverImage || PLACEHOLDER_IMG],
          amenities: Array.isArray(json.amenities) ? json.amenities : [],
          owner: json.owner || { name: "Chủ tin", phone: "", avatar: null },
          rating: Number(json.rating) || 0,
          price: Number(json.price) || 0,
        };

        if (!aborted) {
          setData(normalized);
          setFavCount(getFavoriteCount(normalized.id));
        }

        // tải tin tương tự
        const res2 = await fetch(`${API_BASE}/premises/similar/${id}`);
        if (res2.ok) {
          const sim = await res2.json();
          setSimilar(Array.isArray(sim) ? sim : []);
        }
      } catch (e) {
        if (!aborted) message.error("Không tải được chi tiết tin.");
      }
    }
    load();
    return () => { aborted = true; ctrl.abort(); };
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
                  <img
                    src={src || PLACEHOLDER_IMG}
                    alt={`img-${i}`}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                    style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 6 }}
                  />
                </div>
              ))}
            </Carousel>

            {/* Tiêu đề + Thông tin nhanh */}
            <div style={{ marginTop: 16 }}>
              <Title level={3} style={{ marginBottom: 4 }}>{data.title}</Title>
              <Space wrap size="small">
                <Tag color="red">{currency(data.price)}</Tag>
                <Tag icon={<AreaChartOutlined />}>{data.area_m2} m²</Tag>
                <Tag icon={<TagOutlined />}>{data.businessType}</Tag>
                <Tag icon={<EnvironmentOutlined />}>{data.address}</Tag>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Rate allowHalf disabled defaultValue={data.rating} />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {data.rating} {data.createdAt ? `· Đăng ngày ${data.createdAt}` : ""}
                </Text>
              </div>
            </div>

            <Divider />

            {/* Mô tả */}
            <Title level={4}>Mô tả</Title>
            <Paragraph>{data.description}</Paragraph>

            {/* Tiện ích */}
            {data.amenities.length > 0 && (
              <>
                <Title level={4} style={{ marginTop: 16 }}>Tiện ích</Title>
                <Space size={[8,8]} wrap>
                  {data.amenities.map((a) => (
                    <Tag key={a} color="green">{a}</Tag>
                  ))}
                </Space>
                <Divider />
              </>
            )}

            {/* Thông tin chi tiết */}
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              size="middle"
              items={[
                { key: "1", label: "Giá thuê", children: currency(data.price) },
                { key: "2", label: "Diện tích", children: `${data.area_m2} m²` },
                { key: "3", label: "Loại hình", children: data.businessType },
                { key: "4", label: "Địa chỉ", children: data.address },
              ]}
            />

            <Divider />

            {/* Bản đồ thật */}
            <Title level={4} style={{ marginBottom: 8 }}>Vị trí trên bản đồ</Title>
            {typeof data.latitude === "number" && typeof data.longitude === "number" ? (
              <div style={{ height: 320, border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
                <MapContainer
                  center={[data.latitude, data.longitude]}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Recenter lat={data.latitude} lng={data.longitude} />
                  <Marker position={[data.latitude, data.longitude]} icon={markerIcon}>
                    <Popup>
                      <div style={{ width: 180 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.title}</div>
                        <div style={{ color: "#777", marginBottom: 8 }}>{data.address}</div>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => {
                            const g = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
                            window.open(g, "_blank");
                          }}
                        >
                          Mở Google Maps
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <Text type="secondary">Chưa có toạ độ</Text>
            )}
          </Card>
        </Col>

        {/* RIGHT */}
        <Col xs={24} lg={8}>
          {/* Chủ tin */}
          <Card>
            <Space align="start">
              <Avatar size={48} src={data.owner?.avatar || PLACEHOLDER_AVATAR} />
              <div>
                <Text strong>{data.owner?.name || "Chủ tin"}</Text>
                <div><Text type="secondary">Chủ tin đăng</Text></div>
              </div>
            </Space>

            <Space style={{ marginTop: 12 }} wrap>
              {data.owner?.phone && (
                <Button type="primary" icon={<PhoneOutlined />} onClick={() => message.info(`Gọi: ${data.owner.phone}`)}>
                  {data.owner.phone}
                </Button>
              )}
              <Button icon={<MessageOutlined />} onClick={() => setContactOpen(true)}>Nhắn tin</Button>
              <Button icon={<ShareAltOutlined />}>Chia sẻ</Button>
              <Button type="dashed" icon={<ThunderboltOutlined />} onClick={() => setPredictOpen(true)}>Dự đoán giá</Button>
              <Button
                icon={favCount > 0 ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined />}
                onClick={() => setFavCount(addFavorite(data.id))}
              >
                Yêu thích {favCount ? `(${favCount})` : ""}
              </Button>
            </Space>
          </Card>

          {/* Tin tương tự */}
          <Card title="Tin tương tự" style={{ marginTop: 16 }}>
            <List
              itemLayout="vertical"
              dataSource={similar}
              locale={{ emptyText: "Chưa có tin tương tự" }}
              renderItem={(it) => (
                <List.Item key={it.id}>
                  <Link to={`/listing/${it.id}`}>
                    <img
                      src={it.coverImage || it.img || PLACEHOLDER_IMG}
                      alt={it.title}
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                      style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 6 }}
                    />
                    <div style={{ fontWeight: 600 }}>{it.title}</div>
                    <div style={{ color: "#8c8c8c" }}>
                      {it.areaM2 || it.area_m2} m² · {currency(it.price)}
                    </div>
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
            message.success("Đã gửi (demo)");
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

      {/* Modal dự đoán giá */}
      <Modal
        title="Dự đoán giá (demo)"
        open={predictOpen}
        onCancel={() => setPredictOpen(false)}
        footer={<Button onClick={() => setPredictOpen(false)}>Đóng</Button>}
      >
        <Paragraph>
          Dựa trên diện tích <b>{data.area_m2} m²</b> và loại hình <b>{data.businessType}</b>,
          hệ thống gợi ý khoảng giá: <b>{currency(data.price * 0.95)} – {currency(data.price * 1.1)}</b>.
        </Paragraph>
        <Text type="secondary">*Minh hoạ giao diện.</Text>
      </Modal>
    </div>
  );
}
