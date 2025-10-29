// src/pages/MapPage.jsx
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { message } from "antd";
import HomeFilters from "../components/HomeFilters";

// --- Fix icon mặc định Leaflet (bắt buộc cho Vite/CRA) ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export default function MapPage() {
  const [allItems, setAllItems] = useState([]); // dữ liệu gốc từ API (chỉ những item có lat/lng)
  const [items, setItems] = useState([]);       // dữ liệu sau lọc để hiển thị
  const mapRef = useRef(null);

  // Tải data thật từ API
  useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/premises`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Chuẩn hoá dữ liệu cho map (chỉ giữ những cái có lat/lng)
        const list = (Array.isArray(data) ? data : [])
          .filter((x) => typeof x.latitude === "number" && typeof x.longitude === "number")
          .map((x) => ({
            id: x.id,
            title: x.title || "Không có tiêu đề",
            lat: x.latitude,
            lng: x.longitude,
            address: x.locationText || "",
            price: Number(x.price) || 0,
            area_m2: Number(x.areaM2) || 0,
            type: (x.businessType || "Khác").toLowerCase(), // để lọc theo type
          }));

        if (!aborted) {
          setAllItems(list);
          setItems(list);

          // Fit bounds lần đầu
          if (mapRef.current && list.length) {
            const bounds = L.latLngBounds(list.map((i) => [i.lat, i.lng]));
            mapRef.current.fitBounds(bounds, { padding: [48, 48] });
            setTimeout(() => mapRef.current.invalidateSize(), 250);
          }
        }
      } catch (err) {
        if (!aborted) message.error("Không thể tải dữ liệu mặt bằng cho bản đồ.");
        // console.error(err);
      }
    }

    load();
    return () => { aborted = true; ctrl.abort(); };
  }, []);

  // Lọc trên FE khi người dùng bấm Tìm kiếm
  const handleSearch = ({ keyword, type, city, minPrice, maxPrice, minArea, maxArea }) => {
    const kw = (keyword || "").toLowerCase();

    const filtered = allItems.filter((it) => {
      const okKw =
        !kw ||
        it.title.toLowerCase().includes(kw) ||
        it.address.toLowerCase().includes(kw);

      const okType = !type || it.type === type; // type đã là lowercase ở trên

      const okCity =
        !city ||
        it.address.toLowerCase().includes(
          city === "hcm" ? "hồ chí minh" : city.replace("-", " ")
        );

      const okMinP = !minPrice || it.price >= Number(minPrice);
      const okMaxP = !maxPrice || it.price <= Number(maxPrice);
      const okMinA = !minArea  || it.area_m2 >= Number(minArea);
      const okMaxA = !maxArea  || it.area_m2 <= Number(maxArea);

      return okKw && okType && okCity && okMinP && okMaxP && okMinA && okMaxA;
    });

    setItems(filtered);

    // Fit bounds theo kết quả
    if (mapRef.current) {
      if (filtered.length) {
        const b = L.latLngBounds(filtered.map((x) => [x.lat, x.lng]));
        mapRef.current.fitBounds(b, { padding: [48, 48] });
      } else {
        mapRef.current.setView([21.028511, 105.804817], 12); // Hà Nội center
      }
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 32px" }}>
      {/* Hàng filter: dùng onSearch (đã chuẩn hoá tham số) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12 }}>
        <HomeFilters onSearch={handleSearch} />
      </div>

      {/* Card bản đồ */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,.08)",
          border: "1px solid #f0f0f0",
          background: "#fff",
        }}
      >
        <div style={{ width: "100%", height: "min(72vh, 720px)", minHeight: 360 }}>
          <MapContainer
            whenCreated={(m) => (mapRef.current = m)}
            center={[21.028511, 105.804817]}
            zoom={12}
            scrollWheelZoom
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
            />

            {items.map((it) => (
              <Marker key={it.id} position={[it.lat, it.lng]}>
                <Popup>
                  <div style={{ minWidth: 220 }}>
                    <strong>{it.title}</strong>
                    <div style={{ color: "#666", margin: "4px 0" }}>{it.address}</div>
                    <div style={{ marginBottom: 6 }}>
                      Loại hình: {it.type} <br />
                      Giá: {Intl.NumberFormat("vi-VN").format(it.price)} đ/tháng
                    </div>
                    <Link to={`/listing/${it.id}`}>Xem chi tiết</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
