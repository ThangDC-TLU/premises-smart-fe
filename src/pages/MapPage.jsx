// src/pages/MapPage.jsx
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import HomeFilters from "../components/HomeFilters";

// --- Fix icon Leaflet (Vite/CRA) ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Mock data – sau sẽ thay bằng API
const mockItems = [
  { id: 1, title: "Mặt bằng Cầu Giấy", lat: 21.033, lng: 105.79,  address: "Cầu Giấy, Hà Nội",  price: 15000000, type: "Cửa hàng" },
  { id: 2, title: "Shophouse Long Biên", lat: 21.043, lng: 105.91, address: "Long Biên, Hà Nội",  price: 22000000, type: "Shophouse" },
  { id: 3, title: "Kiot Thanh Xuân",     lat: 21.000, lng: 105.815, address: "Thanh Xuân, Hà Nội", price: 12000000, type: "Kiot" },
];

export default function MapPage() {
  const [items, setItems] = useState(mockItems);
  const mapRef = useRef(null);

  // Lọc tạm thời trên frontend (sau này nối API ở đây)
  const handleFilter = ({ keyword, type, minPrice, maxPrice, minArea, maxArea }) => {
    const kw = (keyword || "").toLowerCase();
    const filtered = mockItems.filter((it) => {
      const okKw =
        !kw ||
        it.title.toLowerCase().includes(kw) ||
        it.address.toLowerCase().includes(kw);
      const okType   = !type || it.type === type;
      const okMinP   = !minPrice || it.price >= Number(minPrice);
      const okMaxP   = !maxPrice || it.price <= Number(maxPrice);
      // minArea / maxArea tuỳ dữ liệu thực – thêm sau
      return okKw && okType && okMinP && okMaxP;
    });
    setItems(filtered);

    if (mapRef.current) {
      if (filtered.length) {
        const b = L.latLngBounds(filtered.map((x) => [x.lat, x.lng]));
        mapRef.current.fitBounds(b, { padding: [48, 48] });
      } else {
        mapRef.current.setView([21.028511, 105.804817], 12);
      }
    }
  };

  // Fit bounds lần đầu
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !items.length) return;
    const bounds = L.latLngBounds(items.map((x) => [x.lat, x.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
    setTimeout(() => map.invalidateSize(), 250);
  }, []);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "16px 16px 32px",
      }}
    >
      {/* Hàng filter – thống nhất với trang Home */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <HomeFilters onFilter={handleFilter} compact />
      </div>

      {/* Card bản đồ có khoảng cách đẹp, không full màn */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,.08)",
          border: "1px solid #f0f0f0",
          background: "#fff",
        }}
      >
        <div
          style={{
            width: "100%",
            // Cao responsive: không quá cao để “ngốn” trang, đủ rộng cho trải nghiệm map
            height: "min(72vh, 720px)",
            minHeight: 360,
          }}
        >
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
                  <div style={{ minWidth: 200 }}>
                    <strong>{it.title}</strong>
                    <div style={{ color: "#666", margin: "4px 0" }}>{it.address}</div>
                    <div style={{ marginBottom: 6 }}>
                      Loại hình: {it.type} <br />
                      Giá: {Intl.NumberFormat("vi-VN").format(it.price)} đ
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
