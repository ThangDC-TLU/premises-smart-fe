// src/components/HomeFilters.jsx
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Input, Button, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
const { Option } = Select;

function niceSteps(min, max, buckets = 6) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    const v = Number.isFinite(min) ? min : Number.isFinite(max) ? max : 0;
    return [v];
  }
  const span = max - min;
  const raw = span / (buckets - 1);
  const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const mult = raw / pow10;
  const nice = (mult <= 1 ? 1 : mult <= 2 ? 2 : mult <= 5 ? 5 : 10) * pow10;
  const start = Math.floor(min / nice) * nice;
  const end = Math.ceil(max / nice) * nice;
  const arr = [];
  for (let x = start; x <= end + 1e-9; x += nice) arr.push(Math.round(x));
  return arr.slice(0, buckets + 1);
}

export default function HomeFilters({ onSearch, data = [] }) {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState();
  const [city, setCity] = useState();
  const [minPrice, setMinPrice] = useState();
  const [maxPrice, setMaxPrice] = useState();
  const [minArea, setMinArea] = useState();
  const [maxArea, setMaxArea] = useState();

  // 🔒 Chỉ cho phép auto search sau khi data đã sẵn sàng ít nhất 1 lần
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (data?.length && !ready) {
      setReady(true);
      onSearch?.({});              // chạy 1 lần để hiển thị toàn bộ ngay khi có data
    }
  }, [data?.length, ready, onSearch]);

  const { cityOpts, priceOpts, areaOpts } = useMemo(() => {
    const cities = Array.from(new Set(data.map(d => d.cityKey).filter(Boolean)));
    const cityOpts = cities.map(k => {
      const first = data.find(d => d.cityKey === k);
      return { value: k, label: first?.cityLabel || k };
    });
    const prices = data.map(d => Number(d.price) || 0);
    const areas  = data.map(d => Number(d.area_m2) || 0);
    const pMin = prices.length ? Math.min(...prices) : 0;
    const pMax = prices.length ? Math.max(...prices) : 0;
    const aMin = areas.length  ? Math.min(...areas)  : 0;
    const aMax = areas.length  ? Math.max(...areas)  : 0;
    return { cityOpts, priceOpts: niceSteps(pMin, pMax, 6), areaOpts: niceSteps(aMin, aMax, 6) };
  }, [data]);

  const fireSearch = () =>
    onSearch?.({ keyword: keyword?.trim(), type, city, minPrice, maxPrice, minArea, maxArea });

  // debounce keyword, chỉ chạy khi ready
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(fireSearch, 300);
    return () => clearTimeout(t);
  }, [keyword, ready]); // eslint-disable-line

  // tự bắn khi thay đổi các select, chỉ chạy khi ready
  useEffect(() => {
    if (!ready) return;
    fireSearch();
  }, [type, city, minPrice, maxPrice, minArea, maxArea, ready]); // eslint-disable-line

  const resetAll = () => {
    setKeyword(""); setType(); setCity();
    setMinPrice(); setMaxPrice(); setMinArea(); setMaxArea();
    if (ready) onSearch?.({});
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

      <Row gutter={[12, 12]}>
        <Col>
          <Select placeholder="Loại hình" style={{ width: 160 }} allowClear value={type} onChange={setType}>
            <Option value="retail">Bán lẻ</Option>
            <Option value="office">Văn phòng</Option>
            <Option value="fnb">F&amp;B</Option>
            <Option value="warehouse">Kho</Option>
          </Select>
        </Col>

        <Col>
          <Select placeholder="Địa điểm" style={{ width: 200 }} allowClear value={city} onChange={setCity} notFoundContent="Trống">
            {cityOpts.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
          </Select>
        </Col>

        <Col>
          <Select placeholder="Giá min" style={{ width: 140 }} allowClear value={minPrice} onChange={(v) => setMinPrice(v ?? undefined)}>
            {priceOpts.map(p => <Option key={`pmin-${p}`} value={p}>{Intl.NumberFormat("vi-VN").format(p)} đ</Option>)}
          </Select>
        </Col>

        <Col>
          <Select placeholder="Giá max" style={{ width: 140 }} allowClear value={maxPrice} onChange={(v) => setMaxPrice(v ?? undefined)}>
            {priceOpts.map(p => <Option key={`pmax-${p}`} value={p}>{Intl.NumberFormat("vi-VN").format(p)} đ</Option>)}
          </Select>
        </Col>

        <Col>
          <Select placeholder="DT min" style={{ width: 140 }} allowClear value={minArea} onChange={(v) => setMinArea(v ?? undefined)}>
            {areaOpts.map(a => <Option key={`amin-${a}`} value={a}>{a} m²</Option>)}
          </Select>
        </Col>

        <Col>
          <Select placeholder="DT max" style={{ width: 140 }} allowClear value={maxArea} onChange={(v) => setMaxArea(v ?? undefined)}>
            {areaOpts.map(a => <Option key={`amax-${a}`} value={a}>{a} m²</Option>)}
          </Select>
        </Col>
      </Row>
    </div>
  );
}
