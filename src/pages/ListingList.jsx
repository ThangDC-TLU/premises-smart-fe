import { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Tag, Typography, Pagination, Space,
  Input, Select, Empty, Skeleton
} from "antd";
import { EnvironmentOutlined, AreaChartOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

/* ================= MOCK DATA (xem UI) ================= */
const MOCK = Array.from({ length: 36 }).map((_, i) => {
  const id = `L${String(i + 1).padStart(3, "0")}`;
  const area = [30, 45, 60, 80, 100, 120][i % 6];
  const price = [8000000, 12000000, 18000000, 25000000, 35000000, 50000000][i % 6];
  const type = ["F&B", "Văn phòng", "Bán lẻ", "Kho bãi"][i % 4];
  const city = ["Hà Nội", "TP. HCM", "Đà Nẵng"][i % 3];
  const district = ["Q.1", "Q.3", "Q.7", "Cầu Giấy", "Thanh Xuân"][i % 5];
  return {
    id,
    title: `${type} – ${area}m², ${district}`,
    price,
    area_m2: area,
    businessType: type,
    address: `${district}, ${city}`,
    img: `https://picsum.photos/seed/${id}/900/600`,
  };
});
const currency = (n) => (n || 0).toLocaleString("vi-VN") + " đ/tháng";

/* ================= PAGE ================= */
export default function ListingList({ title = "Cho thuê mặt bằng kinh doanh" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dataAll, setDataAll] = useState([]);

  // query state từ URL
  const page = Number(searchParams.get("page") || 1);
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const type = searchParams.get("type") || "all";
  const pageSize = 8;

  useEffect(() => {
    // giả lập gọi API
    setLoading(true);
    const t = setTimeout(() => {
      setDataAll(MOCK);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let data = [...dataAll];
    // filter
    if (q) {
      const kw = q.toLowerCase();
      data = data.filter(
        (x) =>
          x.title.toLowerCase().includes(kw) ||
          x.address.toLowerCase().includes(kw) ||
          x.businessType.toLowerCase().includes(kw)
      );
    }
    if (type !== "all") data = data.filter((x) => x.businessType.toLowerCase() === type);

    // sort
    if (sort === "price_asc") data.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") data.sort((a, b) => b.price - a.price);
    if (sort === "area_desc") data.sort((a, b) => b.area_m2 - a.area_m2);
    // newest: giữ nguyên mock
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
        {loading ? "Đang tải..." : <>Hiện có <b>{total}</b> kết quả.</>}
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
            { value: "f&b", label: "F&B" },
            { value: "văn phòng", label: "Văn phòng" },
            { value: "bán lẻ", label: "Bán lẻ" },
            { value: "kho bãi", label: "Kho bãi" },
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
