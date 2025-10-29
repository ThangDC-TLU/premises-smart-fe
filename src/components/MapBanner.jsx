// src/components/MapBanner.jsx
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapBanner({ onOpen }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize?.(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: 280, margin: "16px auto" }}>
      <MapContainer
        whenCreated={(m) => (mapRef.current = m)}
        center={[21.028511, 105.804817]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", borderRadius: 8, overflow: "hidden" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
        />
      </MapContainer>

      {/* Lớp overlay không chặn thao tác map (trừ nút) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",   // ← rất quan trọng
          zIndex: 1000,
        }}
      >
        <button
          onClick={onOpen}
          style={{
            pointerEvents: "auto", // nút vẫn click được
            background: "#fff",
            border: "1px solid #d9d9d9",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,.15)",
            fontWeight: 600,
          }}
          title="Mở bản đồ lớn"
        >
          Bấm vào đây để mở bản đồ lớn
        </button>
      </div>
    </div>
  );
}
