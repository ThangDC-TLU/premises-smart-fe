// src/components/HomeFilters.jsx
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Input, Button, Select, InputNumber, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Text } = Typography;

// format VND cho InputNumber
const vndFormatter = (value) => {
  if (value == null || value === "") return "";
  const n = String(value).replace(/[^\d-]/g, "");
  return n ? `${Intl.NumberFormat("vi-VN").format(Number(n))} đ` : "";
};
const vndParser = (val) => {
  if (typeof val !== "string") return val;
  const n = val.replace(/[^\d-]/g, "");
  return n ? Number(n) : undefined;
};

// format m2 cho InputNumber
const m2Formatter = (value) => {
  if (value == null || value === "") return "";
  const n = String(value).replace(/[^\d-]/g, "");
  return n ? `${n} m²` : "";
};
const m2Parser = (val) => {
  if (typeof val !== "string") return val;
  const n = val.replace(/[^\d-]/g, "");
  return n ? Number(n) : undefined;
};

export default function HomeFilters({ onSearch, data = [] }) {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState();
  const [city, setCity] = useState();
  const [minPrice, setMinPrice] = useState();
  const [maxPrice, setMaxPrice] = useState();
  const [minArea, setMinArea] = useState();
  const [maxArea, setMaxArea] = useState();

  // 🔒 Auto search chỉ sau khi data sẵn sàng lần đầu
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (data?.length && !ready) {
      setReady(true);
      onSearch?.({}); // hiển thị toàn bộ ngay khi có data
    }
  }, [data?.length, ready, onSearch]);

  // danh sách city động từ dữ liệu
  const cityOpts = useMemo(() => {
    const cities = Array.from(new Set(data.map(d => d.cityKey).filter(Boolean)));
    return cities.map(k => {
      const first = data.find(d => d.cityKey === k);
      return { value: k, label: first?.cityLabel || k };
    });
  }, [data]);

  const fireSearch = () => {
    onSearch?.({
      keyword: keyword?.trim(),
      type,
      city,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      minArea : Number.isFinite(minArea)  ? minArea  : undefined,
      maxArea : Number.isFinite(maxArea)  ? maxArea  : undefined,
    });
  };

  // debounce keyword
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(fireSearch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, ready]);

  // tự bắn khi đổi các filter khác
  useEffect(() => {
    if (!ready) return;
    fireSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, city, minPrice, maxPrice, minArea, maxArea, ready]);

  const resetAll = () => {
    setKeyword(""); setType(); setCity();
    setMinPrice(); setMaxPrice(); setMinArea(); setMaxArea();
    if (ready) onSearch?.({});
  };

  // helper đảm bảo state là number hoặc undefined
  const setNum = (setter) => (v) => {
    if (v === null || v === "" || typeof v === "undefined") setter(undefined);
    else {
      const n = Number(v);
      setter(Number.isFinite(n) ? n : undefined);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "16px auto 0", padding: "0 16px" }}>
      <Row gutter={12} align="middle" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Input
            size="large"
            placeholder="Nhập tiêu đề, địa chỉ hoặc loại hình"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<SearchOutlined />} onClick={fireSearch}>
            Tìm kiếm
          </Button>
        </Col>
        <Col>
          <Button size="large" onClick={resetAll}>Xoá lọc</Button>
        </Col>
      </Row>

      <Row gutter={[12, 12]} align="middle">
        <Col>
          <Select
            placeholder="Loại hình"
            style={{ width: 160 }}
            allowClear
            value={type}
            onChange={setType}
          >
            <Option value="retail">Bán lẻ</Option>
            <Option value="office">Văn phòng</Option>
            <Option value="fnb">F&amp;B</Option>
            <Option value="warehouse">Kho</Option>
          </Select>
        </Col>

        <Col>
          <Select
            placeholder="Địa điểm"
            style={{ width: 200 }}
            allowClear
            value={city}
            onChange={setCity}
            notFoundContent="Trống"
          >
            {cityOpts.map(c => (
              <Option key={c.value} value={c.value}>{c.label}</Option>
            ))}
          </Select>
        </Col>

        {/* --------- Giá: nhập tự do --------- */}
        <Col flex="0 0 320px">
          <Row gutter={8} align="middle" wrap={false}>
            <Col flex="84px"><Text type="secondary">Giá từ</Text></Col>
            <Col flex="auto">
              <InputNumber
                style={{ width: "100%" }}
                placeholder="VD: 5.000.000"
                value={minPrice}
                onChange={setNum(setMinPrice)}
                formatter={vndFormatter}
                parser={vndParser}
                min={0}
              />
            </Col>
          </Row>
        </Col>

        <Col flex="0 0 320px">
          <Row gutter={8} align="middle" wrap={false}>
            <Col flex="84px"><Text type="secondary">đến</Text></Col>
            <Col flex="auto">
              <InputNumber
                style={{ width: "100%" }}
                placeholder="VD: 30.000.000"
                value={maxPrice}
                onChange={setNum(setMaxPrice)}
                formatter={vndFormatter}
                parser={vndParser}
                min={0}
              />
            </Col>
          </Row>
        </Col>

        {/* --------- Diện tích: nhập tự do --------- */}
        <Col flex="0 0 240px">
          <Row gutter={8} align="middle" wrap={false}>
            <Col flex="70px"><Text type="secondary">DT từ</Text></Col>
            <Col flex="auto">
              <InputNumber
                style={{ width: "100%" }}
                placeholder="m²"
                value={minArea}
                onChange={setNum(setMinArea)}
                formatter={m2Formatter}
                parser={m2Parser}
                min={0}
              />
            </Col>
          </Row>
        </Col>

        <Col flex="0 0 240px">
          <Row gutter={8} align="middle" wrap={false}>
            <Col flex="70px"><Text type="secondary">đến</Text></Col>
            <Col flex="auto">
              <InputNumber
                style={{ width: "100%" }}
                placeholder="m²"
                value={maxArea}
                onChange={setNum(setMaxArea)}
                formatter={m2Formatter}
                parser={m2Parser}
                min={0}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Gợi ý nhỏ: nếu người dùng nhập ngược, BE/logic onSearch đã swap min/max rồi.
          Nếu muốn swap ở FE, bạn có thể làm trong fireSearch trước khi gọi onSearch. */}
    </div>
  );
}
