import { Row, Col, Input, Button, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function HomeFilters({ onSearch }) {
  return (
    <div style={{ maxWidth: 1200, margin: "16px auto 0", padding: "0 16px" }}>
      {/* Ô tìm kiếm */}
      <Row gutter={12} align="middle" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Input size="large" placeholder="Nhập tiêu đề địa chỉ, mô tả hoặc loại hình"/>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<SearchOutlined />} onClick={onSearch}>
            Tìm kiếm
          </Button>
        </Col>
      </Row>

      {/* Bộ lọc */}
      <Row gutter={[12, 12]}>
        <Col><Select placeholder="Loại hình" style={{ width: 160 }} allowClear>
          <Option value="retail">Bán lẻ</Option>
          <Option value="office">Văn phòng</Option>
          <Option value="fnb">F&B</Option>
          <Option value="warehouse">Kho</Option>
        </Select></Col>

        <Col><Select placeholder="Địa chỉ" style={{ width: 200 }} allowClear>
          <Option value="ha-noi">Hà Nội</Option>
          <Option value="hcm">TP. HCM</Option>
          <Option value="da-nang">Đà Nẵng</Option>
        </Select></Col>

        <Col><Select placeholder="Giá tối thiểu" style={{ width: 140 }} allowClear>
          <Option value="3000000">3 triệu</Option>
          <Option value="5000000">5 triệu</Option>
          <Option value="10000000">10 triệu</Option>
        </Select></Col>

        <Col><Select placeholder="Giá tối đa" style={{ width: 140 }} allowClear>
          <Option value="10000000">10 triệu</Option>
          <Option value="20000000">20 triệu</Option>
          <Option value="50000000">50 triệu</Option>
        </Select></Col>

        <Col><Select placeholder="Diện tích min" style={{ width: 140 }} allowClear>
          <Option value="20">20 m²</Option>
          <Option value="50">50 m²</Option>
          <Option value="100">100 m²</Option>
        </Select></Col>

        <Col><Select placeholder="Diện tích max" style={{ width: 140 }} allowClear>
          <Option value="100">100 m²</Option>
          <Option value="200">200 m²</Option>
          <Option value="500">500 m²</Option>
        </Select></Col>
      </Row>

      {/* Banner bản đồ */}
      <div className="map-banner">
        <img src="https://tile.openstreetmap.org/12/3300/2150.png" alt="map" />
        <button className="map-banner__cta">Bấm vào đây để tìm kiếm chi tiết trên bản đồ</button>
      </div>
    </div>
  );
}
