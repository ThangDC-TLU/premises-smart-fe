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

  // xác định tab active trên menu
  const activeKey = pathname.startsWith("/listings") ? "listings" : "home";

  // tên hiển thị ưu tiên fullName > name > email
  const displayName =
    user?.fullName || user?.name || (user?.email ? user.email.split("@")[0] : "");

  // hàm điều hướng tới dashboard (nếu admin thì thêm query)
  const goToDashboard = () => {
    if (!user) return;
    const roleParam = user?.role === "admin" ? "?role=admin" : "";
    navigate(`/dashboard${roleParam}`);
  };

  // xử lý logout có hỏi xác nhận
  const handleLogout = () => {
    logout();
    message.success("Đã đăng xuất");
    navigate("/login", { replace: true });
  };

  return (
    <AntHeader
      style={{
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        paddingInline: 0,
        height: 64,
      }}
    >
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
        {/* ---------- LOGO + BRAND ---------- */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 220,
          }}
        >
          <img
            src={logo}
            alt="Premises Smart"
            style={{
              height: 40,
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
          <div style={{ lineHeight: 1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: 0.3,
              }}
            >
              Premises Smart
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#8c8c8c",
                marginTop: 2,
              }}
            >
              Find & Rent Smarter
            </div>
          </div>
        </Link>

        {/* ---------- MENU ---------- */}
        <Menu
          mode="horizontal"
          selectedKeys={[activeKey]}
          style={{
            flex: 1,
            borderBottom: "none",
            justifyContent: "center",
          }}
          items={[
            { key: "home", label: <Link to="/">Trang chủ</Link> },
            { key: "listings", label: <Link to="/listings">Danh sách</Link> },
          ]}
        />

        {/* ---------- ACTIONS ---------- */}
        {!user ? (
          // Chưa đăng nhập
          <Space
            size="middle"
            style={{
              minWidth: 220,
              justifyContent: "flex-end",
              display: "flex",
            }}
          >
            <Button type="primary" onClick={() => navigate("/login")}>
              Đăng nhập
            </Button>
            <Button onClick={() => navigate("/register")}>Đăng ký</Button>
          </Space>
        ) : (
          // Đã đăng nhập
          <Space
            size="middle"
            style={{
              minWidth: 260,
              justifyContent: "flex-end",
              display: "flex",
            }}
          >
            {/* Avatar + tên người dùng → mở Dashboard */}
            <Space
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "background 0.2s",
              }}
              onClick={goToDashboard}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Avatar size={28} icon={<UserOutlined />} />
              <Text>{displayName}</Text>
            </Space>

            {/* Đăng tin */}
            <Button type="primary" onClick={() => navigate("/post")}>
              Đăng tin
            </Button>

            {/* Đăng xuất có confirm */}
            <Popconfirm
              title="Đăng xuất"
              description="Bạn có chắc chắn muốn đăng xuất?"
              okText="Đăng xuất"
              cancelText="Hủy"
              placement="bottomRight"
              onConfirm={handleLogout}
            >
              <Button danger>Đăng xuất</Button>
            </Popconfirm>
          </Space>
        )}
      </div>
    </AntHeader>
  );
}
