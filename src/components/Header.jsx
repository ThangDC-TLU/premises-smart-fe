import { Layout, Menu, Button, Space, Avatar, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../auth/AuthContext"; // nếu hook ở file khác, sửa đường dẫn cho đúng

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // user === null khi chưa đăng nhập

  const activeKey = pathname.startsWith("/listings") ? "listings" : "home";

  return (
    <AntHeader style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", paddingInline: 0, height: 64 }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
          height: "100%",
          padding: "0 16px",
        }}
      >
        {/* BRAND */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
          <img
            src={logo}
            alt="Premises Smart"
            style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }}
          />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.3 }}>Premises Smart</div>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>Find & Rent Smarter</div>
          </div>
        </Link>

        {/* MENU */}
        <Menu
          mode="horizontal"
          selectedKeys={[activeKey]}
          style={{ flex: 1, borderBottom: "none", justifyContent: "center" }}
          items={[
            { key: "home", label: <Link to="/">Trang chủ</Link> },
            { key: "listings", label: <Link to="/listings">Danh sách</Link> },
          ]}
        />

        {/* ACTIONS */}
        {!user ? (
          // ---- Chưa đăng nhập: CHỈ 2 nút ----
          <Space size="middle" style={{ minWidth: 220, justifyContent: "flex-end", display: "flex" }}>
            <Button type="primary" onClick={() => navigate("/login")}>
              Đăng nhập
            </Button>
            <Button onClick={() => navigate("/register")}>Đăng ký</Button>
          </Space>
        ) : (
          // ---- Đã đăng nhập ----
          <Space size="middle" style={{ minWidth: 260, justifyContent: "flex-end", display: "flex" }}>
            <Button type="primary" onClick={() => navigate("/post")}>Đăng tin</Button>
            <Space>
              <Avatar size={28} icon={<UserOutlined />} />
              <Text>{user.name}</Text>
            </Space>
            <Button danger onClick={logout}>Đăng xuất</Button>
          </Space>
        )}
      </div>
    </AntHeader>
  );
}
