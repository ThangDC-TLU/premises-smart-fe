import { Layout, Menu, Button, Space, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png"; // ✅ import đúng cách cho Vite

const { Header: AntHeader } = Layout;

export default function Header() {
  const { pathname } = useLocation();

  return (
    <AntHeader style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", paddingInline: 0 }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
          height: 64,
          padding: "0 16px",
        }}
      >
        {/* BRAND: logo + text */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
          <img
            src={logo}
            alt="Premises Smart"
            style={{
              height: 100,         // ✅ chiều cao cố định
              width: "auto",         // ✅ giữ tỉ lệ
              objectFit: "contain",
              display: "block",
            }}
          />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.3 }}>Premises Smart</div>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>Find & Rent Smarter</div>
          </div>
        </Link>

        {/* MENU center */}
        <Menu
          mode="horizontal"
          selectedKeys={[pathname === "/" ? "home" : pathname.replace("/", "")]}
          style={{ flex: 1, borderBottom: "none", justifyContent: "center" }}
          items={[
            { key: "home", label: <Link to="/">Trang chủ</Link> },
            { key: "news", label: <Link to="/news">Tin tức</Link> },
          ]}
        />

        {/* ACTIONS right */}
        <Space size="middle" style={{ minWidth: 260, justifyContent: "flex-end", display: "flex" }}>
            <Space style={{ color: "#595959" }}>
                <Avatar size={28} icon={<UserOutlined />} />
                <span>Người dùng</span>
            </Space>
            <Button type="primary">
                <Link to="/login" style={{ color: "#fff" }}>Đăng nhập</Link>
            </Button>
            <Button danger>
                <Link to="/logout" style={{ color: "#df1111ff" }}>Đăng xuất</Link>
            </Button>
        </Space>
      </div>
    </AntHeader>
  );
}
