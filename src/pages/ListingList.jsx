// src/pages/ListingList.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Tag, Typography, Pagination, Space,
  Empty, Skeleton, message
} from "antd";
import { EnvironmentOutlined, AreaChartOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import HomeFilters from "../components/HomeFilters";

const { Title, Text, Paragraph } = Typography;

const currency = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " đ/tháng";
const PLACEHOLDER_IMG = "https://picsum.photos/seed/premise/900/600";

const TYPE_LABEL = {
  fnb: "F&B",
  retail: "Bán lẻ",
  office: "Văn phòng",
  warehouse: "Kho",
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8089/api";

// Suy ra city từ toạ độ (đồng nhất với Home.jsx)
function cityFromCoords(lat, lng) {
  if (lat >= 20.8 && lat <= 21.3 && lng >= 105.5 && lng <= 106.2) return { key: "ha-noi", label: "Hà Nội" };
  if (lat >= 10.3 && lat <= 11.2 && lng >= 106.1 && lng <= 107.1) return { key: "hcm", label: "TP. HCM" };
  if (lat >= 15.8 && lat <= 16.3 && lng >= 107.9 && lng <= 108.5) return { key: "da-nang", label: "Đà Nẵng" };
  return { key: "khac", label: "Khác" };
}

export default function ListingList({ title = "Cho thuê mặt bằng kinh doanh" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dataAll, setDataAll] = useState([]);
  const [err, setErr] = useState(null);

  // ---- URL state (giữ nguyên sort + page trong URL) ----
  const page = Number(searchParams.get("page") || 1);
  const sort = searchParams.get("sort") || "newest";
  const pageSize = 8;

  // ---- State nhận từ HomeFilters ----
  const [filters, setFilters] = useState({
    keyword: "",
    type: undefined,   // "fnb" | "retail" | "office" | "warehouse"
    city: undefined,   // "ha-noi" | "hcm" | "da-nang" | "khac"
    minPrice: undefined,
    maxPrice: undefined,
    minArea: undefined,
    maxArea: undefined,
  });

  // tải danh sách
  useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/premises`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const mapped = (Array.isArray(json) ? json : []).map((p) => {
          const lat = Number(p.latitude);
          const lng = Number(p.longitude);
          const city = (Number.isFinite(lat) && Number.isFinite(lng))
            ? cityFromCoords(lat, lng)
            : { key: "khac", label: "Khác" };

          const typeKey = (p.businessType || "").toString().toLowerCase().trim(); // fnb|retail|office|warehouse
          const businessType = TYPE_LABEL[typeKey] || p.businessType || "Khác";
          const cover = p.coverImage || (Array.isArray(p.images) && p.images[0]) || PLACEHOLDER_IMG;

          return {
            id: p.id,
            title: p.title || "Không có tiêu đề",
            price: Number(p.price) || 0,
            area_m2: Number(p.areaM2) || 0,
            businessType,        // label hiển thị
            typeKey,             // key để filter
            address: p.locationText || city.label,
            img: cover,
            cityKey: city.key,
            cityLabel: city.label,
            latitude: lat,
            longitude: lng,
            _raw: p,
          };
        });

        if (!aborted) setDataAll(mapped);
      } catch (e) {
        if (!aborted) {
          setErr(e.message || "Fetch error");
          message.error("Không tải được danh sách mặt bằng. Vui lòng kiểm tra API/CORS.");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => { aborted = true; ctrl.abort(); };
  }, []);

  // áp dụng lọc từ HomeFilters
  const filtered = useMemo(() => {
    let data = [...dataAll];
    const {
      keyword, type, city,
      minPrice, maxPrice,
      minArea, maxArea,
    } = filters;

    const kw = (keyword || "").toLowerCase().trim();

    if (kw) {
      data = data.filter((x) =>
        x.title.toLowerCase().includes(kw) ||
        x.address.toLowerCase().includes(kw) ||
        (x.businessType || "").toString().toLowerCase().includes(kw)
      );
    }
    if (type) data = data.filter((x) => x.typeKey === type);
    if (city) data = data.filter((x) => x.cityKey === city);

    // swap min/max nếu nhập ngược
    let pMin = Number.isFinite(minPrice) ? Number(minPrice) : undefined;
    let pMax = Number.isFinite(maxPrice) ? Number(maxPrice) : undefined;
    if (Number.isFinite(pMin) && Number.isFinite(pMax) && pMin > pMax) [pMin, pMax] = [pMax, pMin];

    let aMin = Number.isFinite(minArea) ? Number(minArea) : undefined;
    let aMax = Number.isFinite(maxArea) ? Number(maxArea) : undefined;
    if (Number.isFinite(aMin) && Number.isFinite(aMax) && aMin > aMax) [aMin, aMax] = [aMax, aMin];

    if (Number.isFinite(pMin)) data = data.filter((x) => x.price >= pMin);
    if (Number.isFinite(pMax)) data = data.filter((x) => x.price <= pMax);
    if (Number.isFinite(aMin)) data = data.filter((x) => x.area_m2 >= aMin);
    if (Number.isFinite(aMax)) data = data.filter((x) => x.area_m2 <= aMax);

    // sort
    if (sort === "price_asc") data.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") data.sort((a, b) => b.price - a.price);
    if (sort === "area_desc") data.sort((a, b) => b.area_m2 - a.area_m2);
    // newest: giữ nguyên thứ tự từ API

    return data;
  }, [dataAll, filters, sort]);

  const total = filtered.length;
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const setParams = (obj) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(obj).forEach(([k, v]) => (v === null || v === undefined ? next.delete(k) : next.set(k, v)));
    // đổi sort → về trang 1
    if ("sort" in obj) next.set("page", "1");
    setSearchParams(next);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "16px auto", padding: "0 16px" }}>
      <Title level={2} style={{ marginBottom: 4 }}>{title}</Title>
      <Text type="secondary">
        {loading ? "Đang tải..." : err ? "Có lỗi khi tải dữ liệu." : <>Hiện có <b>{total}</b> kết quả.</>}
      </Text>

      {/* 🔎 Bộ lọc dùng lại HomeFilters */}
      <div style={{ marginTop: 12, marginBottom: 8 }}>
        <HomeFilters
          data={dataAll}
          onSearch={(params) => {
            // nhận state filter từ HomeFilters
            setFilters(params || {});
            // khi đổi filter → reset trang về 1
            setParams({ page: "1" });
          }}
        />
      </div>

      {/* Sort nhỏ (giữ bằng URL) */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "8px 0 16px" }}>
        <select
          value={sort}
          onChange={(e) => setParams({ sort: e.target.value })}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd" }}
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá ↑</option>
          <option value="price_desc">Giá ↓</option>
          <option value="area_desc">Diện tích ↓</option>
        </select>
      </div>

      {/* Grid cards */}
      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <Card style={{ height: 280 }}><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      ) : err ? (
        <Empty description="Không thể tải dữ liệu từ API" style={{ padding: "40px 0" }} />
      ) : total === 0 ? (
        <Empty description="Chưa có kết quả" style={{ padding: "40px 0" }} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {pageData.map((it) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={it.id}>
                <Card
                  hoverable
                  bodyStyle={{ padding: 12 }}
                  cover={
                    <Link to={`/listing/${it.id}`}>
                      <div style={{ position: "relative", width: "100%", height: 170, overflow: "hidden" }}>
                        <img
                          src={it.img}
                          alt={it.title}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                        />
                        <Tag color="geekblue" style={{ position: "absolute", top: 10, left: 10, margin: 0 }}>
                          {it.businessType}
                        </Tag>
                        <div
                          style={{
                            position: "absolute",
                            right: 10,
                            bottom: 10,
                            background: "rgba(0,0,0,.65)",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {currency(it.price)}
                        </div>
                      </div>
                    </Link>
                  }
                >
                  <Link to={`/listing/${it.id}`}>
                    <Title
                      level={5}
                      style={{
                        marginBottom: 6,
                        minHeight: 44,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {it.title}
                    </Title>
                  </Link>

                  <Space wrap size="small" style={{ marginBottom: 6 }}>
                    <Tag icon={<AreaChartOutlined />}>{it.area_m2} m²</Tag>
                  </Space>

                  <Paragraph
                    type="secondary"
                    style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 6 }}
                    ellipsis={{ rows: 1, tooltip: it.address }}
                  >
                    <EnvironmentOutlined /> {it.address}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p) => setParams({ page: String(p) })}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
