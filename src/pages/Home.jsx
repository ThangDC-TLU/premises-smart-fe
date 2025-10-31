import { useEffect, useState } from "react";
import { Layout, Row, Col, Skeleton, message } from "antd";
import HomeFilters from "../components/HomeFilters";
import ListingGrid from "../components/ListingGrid";
import TopFavorites from "../components/TopFavorites";
import MapBanner from "../components/MapBanner";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8089/api";
const PLACEHOLDER_IMG = "https://picsum.photos/seed/premise/900/600";

function cityFromCoords(lat, lng) {
  if (lat >= 20.8 && lat <= 21.3 && lng >= 105.5 && lng <= 106.2) return { key: "ha-noi", label: "Hà Nội" };
  if (lat >= 10.3 && lat <= 11.2 && lng >= 106.1 && lng <= 107.1) return { key: "hcm", label: "TP. HCM" };
  if (lat >= 15.8 && lat <= 16.3 && lng >= 107.9 && lng <= 108.5) return { key: "da-nang", label: "Đà Nẵng" };
  return { key: "khac", label: "Khác" };
}

export default function Home() {
  const navigate = useNavigate();
  const openMap = () => navigate("/map");

  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/premises`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const mapped = (Array.isArray(data) ? data : []).map((p) => {
          const lat = Number(p.latitude);
          const lng = Number(p.longitude);
          const city = (Number.isFinite(lat) && Number.isFinite(lng))
            ? cityFromCoords(lat, lng)
            : { key: "khac", label: "Khác" };
          return {
            id: p.id,
            title: p.title || "Không có tiêu đề",
            price: Number(p.price) || 0,
            area_m2: Number(p.areaM2) || 0,
            businessType: (p.businessType || "khac").toLowerCase(),
            address: p.locationText || city.label,
            img: p.coverImage || (p.images?.[0]) || PLACEHOLDER_IMG,
            cityKey: city.key,
            cityLabel: city.label,
          };
        });

        if (!aborted) {
          setAllItems(mapped);
          setItems(mapped);
        }
      } catch (e) {
        if (!aborted) message.error("Không thể tải danh sách mặt bằng.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; ctrl.abort(); };
  }, []);

  // áp dụng lọc – có hoán đổi min/max nếu người dùng chọn ngược
  const handleSearch = (params = {}) => {
    let { keyword, type, city, minPrice, maxPrice, minArea, maxArea } = params;
    const kw = (keyword || "").toLowerCase();

    // swap min/max khi người dùng chọn ngược
    if (Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }
    if (Number.isFinite(minArea) && Number.isFinite(maxArea) && minArea > maxArea) {
      [minArea, maxArea] = [maxArea, minArea];
    }

    const filtered = allItems.filter((it) => {
      const okKw =
        !kw ||
        it.title.toLowerCase().includes(kw) ||
        it.address.toLowerCase().includes(kw) ||
        it.businessType.toLowerCase().includes(kw);

      const okType = !type || it.businessType === type;
      const okCity = !city || it.cityKey === city;
      const okMinP = !Number.isFinite(minPrice) || it.price >= Number(minPrice);
      const okMaxP = !Number.isFinite(maxPrice) || it.price <= Number(maxPrice);
      const okMinA = !Number.isFinite(minArea)  || it.area_m2 >= Number(minArea);
      const okMaxA = !Number.isFinite(maxArea)  || it.area_m2 <= Number(maxArea);

      return okKw && okType && okCity && okMinP && okMaxP && okMinA && okMaxA;
    });

    setItems(filtered);
  };

  return (
    <Content style={{ background: "#fff" }}>
      <HomeFilters onSearch={handleSearch} data={allItems} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <MapBanner onOpen={openMap} />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px 24px" }}>
        <Row gutter={16} align="top">
          <Col xs={24} lg={17}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
              <ListingGrid items={items} pageSize={8} title="Cho thuê mặt bằng kinh doanh" />
            )}
          </Col>
          <Col xs={24} lg={7} style={{ marginTop: 12 }}>
            <TopFavorites />
          </Col>
        </Row>
      </div>
    </Content>
  );
}
