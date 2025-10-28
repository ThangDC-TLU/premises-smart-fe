import { Layout, Menu, Button, Space, Avatar, Typography, Popconfirm, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../auth/AuthContext";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const activeKey = pathname.startsWith("/listings") ? "listings" : "home";
  const displayName =
    user?.fullName || user?.name || (user?.email ? user.email.split("@")[0] : "");

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
          <img src={logo} alt="Premises Smart" style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }} />
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
          <Space size="middle" style={{ minWidth: 220, justifyContent: "flex-end", display: "flex" }}>
            <Button type="primary" onClick={() => navigate("/login")}>Đăng nhập</Button>
            <Button onClick={() => navigate("/register")}>Đăng ký</Button>
          </Space>
        ) : (
          <Space size="middle" style={{ minWidth: 260, justifyContent: "flex-end", display: "flex" }}>
            <Space>
              <Avatar size={28} icon={<UserOutlined />} />
              <Text>{displayName}</Text>
            </Space>
            <Button type="primary" onClick={() => navigate("/post")}>Đăng tin</Button>
            <Popconfirm
              title="Đăng xuất"
              description="Bạn có chắc chắn muốn đăng xuất?"
              okText="Đăng xuất"
              cancelText="Hủy"
              placement="bottomRight"
              onConfirm={() => {
                logout();
                message.success("Đã đăng xuất");
                navigate("/login", { replace: true });
              }}
            >
              <Button danger>Đăng xuất</Button>
            </Popconfirm>
          </Space>
        )}
      </div>
    </AntHeader>
  );
}
