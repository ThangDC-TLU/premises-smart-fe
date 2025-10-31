// src/components/ListingGrid.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Tag, Typography, Pagination, Space,
  Empty, Skeleton, message
} from "antd";
import { EnvironmentOutlined, AreaChartOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

const PLACEHOLDER_IMG = "https://picsum.photos/seed/premise/900/600";
const TYPE_LABEL = { fnb: "F&B", retail: "Bán lẻ", office: "Văn phòng", warehouse: "Kho" };
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8089/api";

const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const currency = (n) => fmtVND.format(Number(n) || 0).replace("₫", "đ/tháng");

/**
 * ListingGrid
 * - Nếu props.items có mặt: dùng luôn dữ liệu này (đã được parent lọc/mapping)
 * - Nếu props.items không có: tự fetch từ API /premises và tự map hiển thị
 */
export default function ListingGrid({
  items: itemsProp,       // <-- danh sách đã lọc từ Home (tuỳ chọn)
  pageSize = 12,
  title = "Cho thuê mặt bằng kinh doanh",
}) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(!Array.isArray(itemsProp));
  const [err, setErr] = useState(null);
  const [items, setItems] = useState(Array.isArray(itemsProp) ? itemsProp : []);

  // Khi parent truyền items → dùng luôn và tắt loading
  useEffect(() => {
    if (Array.isArray(itemsProp)) {
      setItems(itemsProp);
      setLoading(false);
      setErr(null);
      setPage(1); // reset về trang 1 khi danh sách thay đổi
    }
  }, [itemsProp]);

  // Chỉ fetch khi không có itemsProp
  useEffect(() => {
    if (Array.isArray(itemsProp)) return; // đã có dữ liệu từ parent

    let aborted = false;
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/premises`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const mapped = (Array.isArray(json) ? json : []).map((p) => {
          const typeKey = (p.businessType || "").toString().toLowerCase().trim();
          const businessType = TYPE_LABEL[typeKey] || p.businessType || "Khác";
          const cover = p.coverImage || (Array.isArray(p.images) && p.images[0]) || PLACEHOLDER_IMG;
          return {
            id: p.id,
            title: p.title || "Không có tiêu đề",
            price: Number(p.price) || 0,
            area_m2: Number(p.areaM2) || 0,
            businessType,                 // label hiển thị
            address: p.locationText || "",
            img: cover,
          };
        });

        if (!aborted) {
          setItems(mapped);
          setPage(1);
        }
      } catch (e) {
        if (!aborted) {
          setErr(e.message || "Fetch error");
          message.error("Không tải được danh sách mặt bằng. Kiểm tra API/CORS.");
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
  }, [itemsProp]);

  const total = items.length;
  const pageData = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return (
    <div>
      <Title level={2} style={{ marginBottom: 4 }}>{title}</Title>
      <Text type="secondary">
        {loading ? "Đang tải..." : err ? "Có lỗi khi tải dữ liệu." :
          <>Hiện có <b>{total}</b> kết quả trên <b>{Math.max(1, Math.ceil(total / pageSize))}</b> trang.</>}
      </Text>

      {/* Grid */}
      {loading ? (
        <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
          {Array.from({ length: pageSize }).map((_, i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <Card style={{ height: 280 }}><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      ) : err ? (
        <Empty description="Không thể tải dữ liệu từ API" style={{ marginTop: 24 }} />
      ) : total === 0 ? (
        <Empty description="Không có kết quả phù hợp" style={{ marginTop: 24 }} />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            {pageData.map((it) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={it.id}>
                <Card
                  hoverable
                  cover={
                    <Link to={`/listing/${it.id}`}>
                      <img
                        src={it.img}
                        alt={it.title}
                        style={{ width: "100%", height: 160, objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                        loading="lazy"
                      />
                    </Link>
                  }
                >
                  <Link to={`/listing/${it.id}`}>
                    <Title level={5} style={{
                      marginBottom: 6,
                      minHeight: 44,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {it.title}
                    </Title>
                  </Link>

                  <Space wrap size="small" style={{ marginBottom: 6 }}>
                    <Tag color="red">{currency(it.price)}</Tag>
                    <Tag icon={<AreaChartOutlined />}>{it.area_m2} m²</Tag>
                    {/* Nếu parent đã cung cấp label rồi thì dùng luôn */}
                    <Tag>{TYPE_LABEL[it.businessType] || it.businessType}</Tag>
                  </Space>

                  <div style={{ color: "#8c8c8c" }}>
                    <EnvironmentOutlined /> {it.address}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
