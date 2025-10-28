// src/pages/PostListing.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card, Steps, Form, Input, InputNumber, Select, Button, Row, Col,
  Upload, message, Typography, Space, Tag
} from "antd";
import { PlusOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import api from "../api/client"; // axios instance (baseURL = /api)

const { Title, Paragraph, Text } = Typography;

// --- Marker icon cho Leaflet (fix khi dùng bundler) ---
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- Fly map tới vị trí mới ---
function FlyTo({ latlng }) {
  const map = useMap();
  useEffect(() => {
    if (latlng) map.flyTo(latlng, 16, { duration: 0.7 });
  }, [latlng]);
  return null;
}

// --- Geocode bằng Nominatim (OpenStreetMap) ---
async function geocodeAddress(fullAddress) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    fullAddress
  )}&addressdetails=1&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "vi" } });
  if (!res.ok) throw new Error("Không geocode được địa chỉ");
  const data = await res.json();
  if (!data?.length) throw new Error("Không tìm thấy vị trí phù hợp");
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export default function PostListing() {
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Location state
  const [latLng, setLatLng] = useState(null); // {lat,lng}
  const lastQueryRef = useRef("");

  const steps = [
    { title: "Thông tin cơ bản" },
    { title: "Vị trí" },
    { title: "Hình ảnh" },
    { title: "Xem trước & đăng" },
  ];

  // Cho phép quay lại step vị trí vẫn giữ marker
  useEffect(() => {
    const lat = form.getFieldValue("lat");
    const lng = form.getFieldValue("lng");
    if (lat && lng) setLatLng({ lat: Number(lat), lng: Number(lng) });
  }, []);

  const next = async () => {
    try {
      if (step === 0) await form.validateFields(["title", "price", "area_m2", "businessType"]);
      else if (step === 1) {
        await form.validateFields(["address", "district", "city"]);
        const lt = form.getFieldValue("lat");
        const lg = form.getFieldValue("lng");
        if (!lt || !lg) {
          message.warning("Hãy bấm 'Tìm vị trí' và đặt marker trên bản đồ.");
          return;
        }
      }
      setStep((s) => s + 1);
    } catch {}
  };
  const prev = () => setStep((s) => s - 1);

  const customUpload = ({ onSuccess }) => setTimeout(() => onSuccess("ok"), 350); // demo

  const handleSearch = async () => {
    const addr = form.getFieldValue("address")?.trim();
    const district = form.getFieldValue("district")?.trim();
    const city = form.getFieldValue("city")?.trim();
    if (!addr || !district || !city) {
      message.warning("Nhập đủ Địa chỉ, Quận/Huyện, Tỉnh/Thành phố");
      return;
    }
    const full = `${addr}, ${district}, ${city}`;
    if (lastQueryRef.current === full && latLng) return; // tránh gọi lại
    try {
      const pos = await geocodeAddress(full);
      setLatLng(pos);
      form.setFieldsValue({ lat: pos.lat, lng: pos.lng });
      lastQueryRef.current = full;
      message.success("Đã xác định vị trí");
    } catch (e) {
      message.error(e.message || "Geocode thất bại");
    }
  };

  const onMarkerDragEnd = (e) => {
    const m = e.target.getLatLng();
    const pos = { lat: m.lat, lng: m.lng };
    setLatLng(pos);
    form.setFieldsValue(pos);
  };

  const submit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);

      // Chuẩn bị payload — minh hoạ. Tùy BE mà đổi field cho khớp.
      const payload = {
        title: values.title,
        description: values.description || "",
        price: Number(values.price),
        areaM2: Number(values.area_m2),
        businessType: values.businessType, // fnb/office/retail/warehouse
        address: values.address,
        district: values.district,
        city: values.city,
        latitude: values.lat,
        longitude: values.lng,
        images: fileList.map((f) => f.name), // demo (thực tế cần upload & lấy URL)
      };

      setSubmitting(true);
      // Demo: in log. Khi nối BE, bật dòng dưới:
      // await api.post("/premises", payload);
      console.log("POST DATA", payload);

      message.success("Đã gửi dữ liệu đăng tin!");
      setStep(0);
      form.resetFields();
      setLatLng(null);
      setFileList([]);
    } catch (e) {
      // antd đã hiển thị lỗi validate
    } finally {
      setSubmitting(false);
    }
  };

  const values = form.getFieldsValue(true);
  const center = useMemo(() => latLng || { lat: 21.0278, lng: 105.8342 }, [latLng]); // default Hà Nội

  return (
    <div style={{ maxWidth: 1000, margin: "16px auto", padding: "0 16px" }}>
      <Title level={3} style={{ marginBottom: 12 }}>Đăng tin mặt bằng</Title>

      <Card>
        <Steps current={step} items={steps} size="small" />
        <div style={{ marginTop: 16 }} />

        {/* STEP 1 – BASIC */}
        {step === 0 && (
          <Form form={form} layout="vertical">
            <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
              <Input placeholder="VD: Mặt bằng góc 2 mặt tiền, phù hợp F&B" />
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item label="Giá thuê (đ/tháng)" name="price" rules={[{ required: true }]}>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    step={500000}
                    formatter={(v) => v && `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(v) => (v || "").replace(/\D/g, "")}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Diện tích (m²)" name="area_m2" rules={[{ required: true }]}>
                  <InputNumber style={{ width: "100%" }} min={5} step={5} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Loại hình" name="businessType" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: "fnb", label: "F&B" },
                      { value: "office", label: "Văn phòng" },
                      { value: "retail", label: "Bán lẻ" },
                      { value: "warehouse", label: "Kho bãi" },
                    ]}
                    placeholder="Chọn loại hình"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Mô tả" name="description">
              <Input.TextArea rows={5} placeholder="Mô tả chi tiết, điều kiện, cọc, ưu điểm…" />
            </Form.Item>
          </Form>
        )}

        {/* STEP 2 – LOCATION */}
        {step === 1 && (
          <Form form={form} layout="vertical">
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label="Địa chỉ" name="address" rules={[{ required: true }]}>
                  <Input placeholder="Số nhà, tên đường…" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Quận/Huyện" name="district" rules={[{ required: true }]}>
                  <Input placeholder="VD: Quận 1" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Tỉnh/Thành phố" name="city" rules={[{ required: true }]}>
                  <Input placeholder="VD: TP. HCM" />
                </Form.Item>
              </Col>
            </Row>

            <Space>
              <Button type="primary" onClick={handleSearch} icon={<EnvironmentOutlined />}>
                Tìm vị trí
              </Button>
              <Text type="secondary">Kéo marker để tinh chỉnh tọa độ.</Text>
            </Space>

            <Card type="inner" title="Vị trí trên bản đồ" style={{ marginTop: 8 }}>
              <div style={{ height: 360, borderRadius: 8, overflow: "hidden" }}>
                <MapContainer center={center} zoom={latLng ? 16 : 12} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {latLng && (
                    <>
                      <FlyTo latlng={latLng} />
                      <Marker
                        position={latLng}
                        draggable
                        eventHandlers={{ dragend: onMarkerDragEnd }}
                        icon={markerIcon}
                      />
                    </>
                  )}
                </MapContainer>
              </div>

              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col xs={24} md={8}>
                  <Form.Item label="Lat" name="lat">
                    <Input readOnly />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Lng" name="lng">
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Form>
        )}

        {/* STEP 3 – IMAGES */}
        {step === 2 && (
          <div>
            <Paragraph>Thêm tối đa 8 ảnh (ảnh đầu tiên sẽ làm ảnh đại diện).</Paragraph>
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={customUpload}
              onChange={({ fileList }) => setFileList(fileList.slice(0, 8))}
              multiple
            >
              {fileList.length >= 8 ? null : (
                <button type="button" style={{ border: 0, background: "none" }}>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </button>
              )}
            </Upload>
          </div>
        )}

        {/* STEP 4 – PREVIEW */}
        {step === 3 && (
          <div style={{ lineHeight: 1.7 }}>
            <Title level={4} style={{ marginTop: 0 }}>{values.title || "(Chưa có tiêu đề)"}</Title>
            <Space wrap size="small" style={{ marginBottom: 8 }}>
              <Tag color="red">{values.price ? Number(values.price).toLocaleString() : 0} đ/tháng</Tag>
              <Tag>{values.area_m2 || 0} m²</Tag>
              <Tag>{(values.businessType || "").toUpperCase()}</Tag>
            </Space>
            <Paragraph type="secondary">
              {values.address ? `${values.address}, ${values.district || ""}, ${values.city || ""}` : "Chưa có địa chỉ"}
            </Paragraph>
            <Paragraph>{values.description || "Chưa có mô tả."}</Paragraph>

            <Row gutter={12}>
              {fileList.length === 0 ? (
                <Paragraph type="secondary">Chưa tải ảnh.</Paragraph>
              ) : (
                fileList.map((f) => (
                  <Col xs={12} md={8} lg={6} key={f.uid}>
                    <img
                      src={f.thumbUrl || f.url}
                      alt={f.name}
                      style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                    />
                  </Col>
                ))
              )}
            </Row>
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <Button disabled={step === 0} onClick={prev}>Quay lại</Button>
          {step < steps.length - 1 ? (
            <Button type="primary" onClick={next}>Tiếp tục</Button>
          ) : (
            <Button type="primary" loading={submitting} onClick={submit}>Đăng tin</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
