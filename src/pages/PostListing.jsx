// src/pages/PostListing.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card, Steps, Form, Input, InputNumber, Select, Button, Row, Col,
  Upload, message, Typography, Space, Tag, Tooltip
} from "antd";
import { PlusOutlined, EnvironmentOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPremises } from "../api/premises";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

/* ======================
   Cloudinary (unsigned)
====================== */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Upload 1 file → secure_url
async function uploadToCloudinary(fileLike) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Thiếu Cloudinary .env (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).");
  }
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const file = fileLike?.originFileObj instanceof File ? fileLike.originFileObj : fileLike;
  if (!(file instanceof File)) throw new Error("File không hợp lệ (thiếu originFileObj).");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: fd });
  const raw = await res.text();
  if (!res.ok) {
    let msg = "Upload ảnh thất bại";
    try { msg = JSON.parse(raw)?.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const data = JSON.parse(raw);
  if (!data?.secure_url) throw new Error("Không nhận được secure_url từ Cloudinary");
  return data.secure_url;
}

// Adapter cho Antd Upload
const cloudinaryRequest = async ({ file, onSuccess, onError, onProgress }) => {
  try {
    onProgress?.({ percent: 20 });
    const secureUrl = await uploadToCloudinary(file);
    onProgress?.({ percent: 100 });
    onSuccess?.({ url: secureUrl, secure_url: secureUrl }, file);
  } catch (e) {
    onError?.(e);
    message.error(e.message || "Upload ảnh thất bại");
  }
};

/* ======================
   Leaflet marker icon
====================== */
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* ======================
   Map helper
====================== */
function FlyTo({ latlng }) {
  const map = useMap();
  useEffect(() => { if (latlng) map.flyTo(latlng, 16, { duration: 0.7 }); }, [latlng, map]);
  return null;
}

/* ======================
   Geocode helpers (VN)
====================== */
const VN_VIEWBOX = { left: 102.14441, bottom: 8.179066, right: 109.46981, top: 23.39247 };

function stripDiacritics(s = "") {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d");
}
function tokenize(q) { return q.split(",").map(x => x.trim()).filter(Boolean); }
function buildQueries(raw) {
  const base = raw.trim().replace(/\s+/g, " ");
  const tokens = tokenize(base);
  const withVN = (s) => (/(vi(e|ê)t\s*nam)/i.test(s) ? s : `${s}, Việt Nam`);

  const variants = new Set();
  variants.add(withVN(base));
  if (tokens.length > 1) {
    variants.add(withVN(tokens.join(", ")));
    variants.add(withVN(tokens.slice().reverse().join(", ")));
  }
  if (tokens.length >= 2) variants.add(withVN(tokens.slice(-2).join(", ")));
  if (tokens.length >= 3) variants.add(withVN(tokens.slice(-3).join(", ")));
  Array.from(variants).map(v => stripDiacritics(v)).forEach(v => variants.add(v));
  return Array.from(variants);
}

async function geocodeAddressSmart(rawQuery) {
  const variants = buildQueries(rawQuery);
  for (const q of variants) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "vn");
    url.searchParams.set("viewbox", `${VN_VIEWBOX.left},${VN_VIEWBOX.top},${VN_VIEWBOX.right},${VN_VIEWBOX.bottom}`);
    url.searchParams.set("bounded", "1");
    url.searchParams.set("dedupe", "1");
    url.searchParams.set("accept-language", "vi");

    try {
      const res = await fetch(url.toString(), { headers: { "Accept-Language": "vi", "Referer": window.location.origin } });
      if (!res.ok) continue;
      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) continue;

      const sorted = arr
        .filter(x => x?.lat && x?.lon)
        .sort((a, b) => {
          const score = (x) => {
            let s = 0;
            if (x.class === "boundary" || x.class === "place") s += 2;
            if ((x.address?.country_code || "").toLowerCase() === "vn") s += 2;
            if (x.type === "administrative" || x.type === "city" || x.type === "town" || x.type === "village") s += 1;
            return -s;
          };
          return score(a) - score(b);
        });

      const top = sorted[0];
      if (top) return { lat: parseFloat(top.lat), lng: parseFloat(top.lon), raw: top };
    } catch {
      // thử biến thể tiếp theo
    }
  }
  throw new Error("Không tìm thấy vị trí phù hợp. Hãy nhập 'Số nhà, Đường, Huyện/Quận, Tỉnh/TP, Việt Nam'.");
}

/* ======================
   Component
====================== */
export default function PostListing() {
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [latLng, setLatLng] = useState(null);
  const [searching, setSearching] = useState(false);
  const lastQueryRef = useRef("");
  const nav = useNavigate();

  const steps = [
    { title: "Thông tin cơ bản" },
    { title: "Vị trí" },
    { title: "Hình ảnh" },
    { title: "Xem trước & đăng" },
  ];

  useEffect(() => {
    const lat = form.getFieldValue("lat");
    const lng = form.getFieldValue("lng");
    if (lat && lng) setLatLng({ lat: Number(lat), lng: Number(lng) });
  }, []); // giữ marker khi quay lại

  const next = async () => {
    try {
      if (step === 0) {
        await form.validateFields(["title", "price", "area_m2", "businessType"]);
      } else if (step === 1) {
        await form.validateFields(["locationQuery"]);
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

  const handleSearch = async () => {
    const q = (form.getFieldValue("locationQuery") || "").trim();
    if (q.length < 3) {
      message.info("Nhập địa chỉ rõ hơn (vd: 'Phú Mỹ, Xuân Lộc, Hậu Lộc, Thanh Hóa').");
      return;
    }
    if (lastQueryRef.current === q && latLng) return;

    try {
      setSearching(true);
      const pos = await geocodeAddressSmart(q);
      setLatLng(pos);
      form.setFieldsValue({ lat: pos.lat, lng: pos.lng });
      lastQueryRef.current = q;
      message.success("Đã xác định vị trí");
    } catch (e) {
      message.error(e.message || "Geocode thất bại");
    } finally {
      setSearching(false);
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

      // Lấy link Cloudinary; ảnh đầu tiên là coverImage
      const normalized = (fileList || []).map((f) => f.url || f.response?.url || f.response?.secure_url).filter(Boolean);
      const images = normalized
        .filter((u) => /^https?:\/\/res\.cloudinary\.com\//i.test(u))
        .slice(0, 8);

      if (images.length === 0) {
        message.warning("Vui lòng upload ít nhất 1 ảnh (Cloudinary) trước khi đăng.");
        return;
      }

      const payload = {
        title: values.title,
        description: values.description || "",
        price: Number(values.price),
        areaM2: Number(values.area_m2),
        businessType: values.businessType,
        locationText: values.locationQuery || "",
        latitude: Number(values.lat),
        longitude: Number(values.lng),
        coverImage: images[0],   // ✅ Ảnh bìa
        images,                  // toàn bộ ảnh (bao gồm coverImage ở index 0)
      };

      setSubmitting(true);
      await createPremises(payload);
      message.success("Đăng tin thành công!");

      // Điều hướng về Trang chủ
      nav("/", { replace: true });

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Đăng tin thất bại";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const values = form.getFieldsValue(true);
  const center = useMemo(() => latLng || { lat: 21.0278, lng: 105.8342 }, [latLng]);

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
            <Form.Item
              label={
                <Space size={6}>
                  <span>Nhập vị trí</span>
                  <Tooltip
                    title={
                      <>
                        Ảnh đầu tiên sẽ là <b>ảnh bìa</b>. <br />
                        Ví dụ địa chỉ dễ tìm: <br />
                        • <Text code>Phú Mỹ, Xuân Lộc, Hậu Lộc, Thanh Hóa</Text> <br />
                        • <Text code>123 Nguyễn Trãi, Thanh Xuân, Hà Nội</Text> <br />
                        • <Text code>25 Lê Lợi, Quận 1, TP.HCM</Text>
                      </>
                    }
                  >
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name="locationQuery"
              rules={[{ required: true, message: "Nhập địa chỉ để tìm vị trí" }]}
              extra="Mẹo: Gõ theo thứ tự nhỏ → lớn (xã/phường, huyện/quận, tỉnh/thành phố), thêm 'Việt Nam' nếu cần."
            >
              <Input
                placeholder="VD: Phú Mỹ, Xuân Lộc, Hậu Lộc, Thanh Hóa"
                onPressEnter={handleSearch}
                allowClear
              />
            </Form.Item>

            <Space wrap>
              <Button type="primary" onClick={handleSearch} icon={<EnvironmentOutlined />} loading={searching}>
                Tìm vị trí
              </Button>
              <Text type="secondary">Kéo marker để tinh chỉnh toạ độ sau khi tìm thấy.</Text>
            </Space>

            <Card type="inner" title="Vị trí trên bản đồ" style={{ marginTop: 8 }}>
              <div style={{ height: 360, borderRadius: 8, overflow: "hidden" }}>
                <MapContainer center={center} zoom={latLng ? 16 : 12} style={{ height: "100%", width: "100%" }}>
                  <TileLayer attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {latLng && (
                    <>
                      <FlyTo latlng={latLng} />
                      <Marker position={latLng} draggable eventHandlers={{ dragend: onMarkerDragEnd }} icon={markerIcon} />
                    </>
                  )}
                </MapContainer>
              </div>

              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col xs={24} md={8}>
                  <Form.Item label="Lat" name="lat"><Input readOnly /></Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Lng" name="lng"><Input readOnly /></Form.Item>
                </Col>
              </Row>
            </Card>
          </Form>
        )}

        {/* STEP 3 – IMAGES */}
        {step === 2 && (
          <div>
            <Paragraph>
              Upload tối đa 8 ảnh. <b>Ảnh đầu tiên là ảnh bìa</b>
            </Paragraph>

            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={cloudinaryRequest}
              onChange={({ fileList }) => {
                const normalized = fileList.map((f) => {
                  const url = f.url || f.response?.url || f.response?.secure_url;
                  return { ...f, url, thumbUrl: undefined };
                });
                setFileList(normalized.slice(0, 8));
              }}
              multiple
              accept="image/*"
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
            <Paragraph type="secondary">{values.locationQuery || "Chưa có địa chỉ"}</Paragraph>
            <Paragraph>{values.description || "Chưa có mô tả."}</Paragraph>

            <Row gutter={12}>
              {fileList.length === 0 ? (
                <Paragraph type="secondary">Chưa tải ảnh.</Paragraph>
              ) : (
                fileList.map((f, idx) => (
                  <Col xs={12} md={8} lg={6} key={f.uid}>
                    <div style={{ position: "relative" }}>
                      {idx === 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "#faad14",
                            color: "#fff",
                            fontSize: 12,
                            padding: "2px 6px",
                            borderRadius: 6,
                            zIndex: 1
                          }}
                        >
                          Ảnh bìa
                        </span>
                      )}
                      <img
                        src={f.url}
                        alt={f.name}
                        style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                      />
                    </div>
                  </Col>
                ))
              )}
            </Row>
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <Button disabled={step === 0} onClick={prev}>Quay lại</Button>
          {step < 3 ? (
            <Button type="primary" onClick={next}>Tiếp tục</Button>
          ) : (
            <Button type="primary" loading={submitting} onClick={submit}>Đăng tin</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
