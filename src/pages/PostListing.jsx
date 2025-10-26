import { useState } from "react";
import {
  Card, Steps, Form, Input, InputNumber, Select, Button, Row, Col,
  Upload, message, Typography, Space, Tag
} from "antd";
import { PlusOutlined, EnvironmentOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function PostListing() {
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const next = async () => {
    try {
      await form.validateFields(step === 0 ? ["title","price","area_m2","businessType"] :
                                step === 1 ? ["address","district","city"] : []);
      setStep((s) => s + 1);
    } catch {}
  };
  const prev = () => setStep((s) => s - 1);

  const submit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      // Demo UI: chỉ hiển thị thông báo
      console.log("POST DATA", { ...values, images: fileList.map(f=>f.name) });
      message.success("(Demo) Đã gửi dữ liệu đăng tin!");
    } catch {}
  };

  const customUpload = ({ onSuccess }) => {
    setTimeout(() => onSuccess("ok"), 400); // giả lập upload thành công
  };

  const steps = [
    { title: "Thông tin cơ bản" },
    { title: "Vị trí" },
    { title: "Hình ảnh" },
    { title: "Xem trước & đăng" },
  ];

  const values = form.getFieldsValue(true);

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
                    formatter={(v)=> v && `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(v)=> v.replace(/\D/g,"")}
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

            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item label="Kinh độ (lng)" name="lng">
                  <Input placeholder="VD: 106.7" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Vĩ độ (lat)" name="lat">
                  <Input placeholder="VD: 10.77" />
                </Form.Item>
              </Col>
            </Row>

            {/* Map giả lập */}
            <Card
              type="inner"
              title={<Space><EnvironmentOutlined />Vị trí trên bản đồ (minh họa)</Space>}
              style={{ marginTop: 8 }}
            >
              <img
                src="https://tile.openstreetmap.org/12/3300/2150.png"
                alt="map"
                style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 8 }}
              />
              <Paragraph type="secondary" style={{ marginTop: 6 }}>
                *Sau này tích hợp bản đồ (Leaflet/Google Maps) để chọn tọa độ trực tiếp.
              </Paragraph>
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
            <Button type="primary" onClick={submit}>Đăng tin</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
