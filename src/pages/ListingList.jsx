// src/pages/ListingList.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Tag, Typography, Pagination, Space,
  Input, Select, Empty, Skeleton, message
} from "antd";
import { EnvironmentOutlined, AreaChartOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const currency = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " đ/tháng";
const PLACEHOLDER_IMG = "https://picsum.photos/seed/premise/900/600";

// map key → label để hiển thị
const TYPE_LABEL = {
  fnb: "F&B",
  retail: "Bán lẻ",
  office: "Văn phòng",
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export default function ListingList({ title = "Cho thuê mặt bằng kinh doanh" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dataAll, setDataAll] = useState([]);
  const [err, setErr] = useState(null);

  // query state từ URL
  const page = Number(searchParams.get("page") || 1);
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const type = searchParams.get("type") || "all";
  const pageSize = 8;

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

        // Chuẩn hóa dữ liệu cho UI
        const mapped = (Array.isArray(json) ? json : []).map((p) => {
          const typeKey = (p.businessType || "").toString().toLowerCase().trim(); // fnb | retail | office
          const businessType = TYPE_LABEL[typeKey] || p.businessType || "Khác";
          const cover = p.coverImage || (Array.isArray(p.images) && p.images[0]) || PLACEHOLDER_IMG;
          return {
            id: p.id,
            title: p.title || "Không có tiêu đề",
            price: Number(p.price) || 0,
            area_m2: Number(p.areaM2) || 0,
            businessType,        // label hiển thị
            typeKey,             // key để filter
            address: p.locationText || "",
            img: cover,
            _raw: p,             // giữ bản gốc (nếu cần)
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
    return () => {
      aborted = true;
      ctrl.abort();
    };
  }, []);

  const filtered = useMemo(() => {
    let data = [...dataAll];

    // filter text
    if (q) {
      const kw = q.toLowerCase();
      data = data.filter(
        (x) =>
          x.title.toLowerCase().includes(kw) ||
          x.address.toLowerCase().includes(kw) ||
          x.businessType.toLowerCase().includes(kw)
      );
    }
    // filter type theo key gốc (fnb | retail | office)
    if (type !== "all") data = data.filter((x) => x.typeKey === type);

    // sort
    if (sort === "price_asc") data.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") data.sort((a, b) => b.price - a.price);
    if (sort === "area_desc") data.sort((a, b) => b.area_m2 - a.area_m2);
    // newest: giữ nguyên theo API
    return data;
  }, [dataAll, q, sort, type]);

  const total = filtered.length;
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const setParams = (obj) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(obj).forEach(([k, v]) => (v === null || v === undefined ? next.delete(k) : next.set(k, v)));
    // khi đổi filter/sort → về trang 1
    if ("q" in obj || "sort" in obj || "type" in obj) next.set("page", "1");
    setSearchParams(next);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "16px auto", padding: "0 16px" }}>
      <Title level={2} style={{ marginBottom: 4 }}>{title}</Title>
      <Text type="secondary">
        {loading ? "Đang tải..." : err ? "Có lỗi khi tải dữ liệu." : <>Hiện có <b>{total}</b> kết quả.</>}
      </Text>

      {/* Toolbar: tìm kiếm + lọc + sắp xếp */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0 16px" }}>
        <Input.Search
          placeholder="Tìm theo tiêu đề, địa chỉ, loại hình…"
          allowClear
          defaultValue={q}
          onSearch={(v) => setParams({ q: v || null })}
          style={{ width: 360 }}
        />
        <Select
          defaultValue={type}
          onChange={(v) => setParams({ type: v })}
          options={[
            { value: "all", label: "Tất cả loại hình" },
            { value: "fnb", label: "F&B" },
            { value: "retail", label: "Bán lẻ" },
            { value: "office", label: "Văn phòng" },
          ]}
          style={{ width: 180 }}
        />
        <Select
          defaultValue={sort}
          onChange={(v) => setParams({ sort: v })}
          options={[
            { value: "newest", label: "Mới nhất" },
            { value: "price_asc", label: "Giá ↑" },
            { value: "price_desc", label: "Giá ↓" },
            { value: "area_desc", label: "Diện tích ↓" },
          ]}
          style={{ width: 140 }}
        />
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
                        {/* overlay loại hình */}
                        <Tag
                          color="geekblue"
                          style={{ position: "absolute", top: 10, left: 10, margin: 0 }}
                        >
                          {it.businessType}
                        </Tag>
                        {/* overlay giá */}
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
