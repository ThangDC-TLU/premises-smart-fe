// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Tabs, Card, Row, Col, Statistic, Progress, Tag, List, Button, Space,
  Table, Typography, Popconfirm, message, Form, Input, Empty
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  EyeOutlined, HeartOutlined, LikeOutlined, EditOutlined, DeleteOutlined,
  BarChartOutlined, LockOutlined
} from "@ant-design/icons";
import { getAllFavorites } from "../utils/favorites";
import { useAuth } from "../auth/AuthContext";
import AdminAnalytics from "../components/AdminAnalytics";

const { Title, Text, Paragraph } = Typography;

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8089/api";
const PLACEHOLDER_IMG = "https://picsum.photos/seed/premise/900/600";
const TYPE_LABEL = { fnb: "F&B", retail: "Bán lẻ", office: "Văn phòng", warehouse: "Kho" };

/* ========= helper ========= */
function currency(n) {
  return Intl.NumberFormat("vi-VN").format(Number(n) || 0) + " đ/tháng";
}

/* --- Lấy role từ context --- */
function useRole() {
  const { user } = useAuth();
  return String(user?.role?.name ?? user?.role ?? "user").toLowerCase();
}

/* ===================== TABS ===================== */

/* --- Tổng quan --- */
function OverviewTab() {
  const metrics = { totalPosts: 12, totalViews: 8450, totalFavorites: 138, engagementRate: 62 };
  const recent = [
    { id: "l_01", title: "Mặt bằng Q.1 góc 2 mặt tiền", views: 523, likes: 25, favs: 9, time: "Hôm nay" },
    { id: "l_02", title: "Văn phòng Q.3 80m²", views: 311, likes: 18, favs: 7, time: "Hôm qua" },
    { id: "l_03", title: "Kho Q.7 120m²", views: 287, likes: 10, favs: 4, time: "2 ngày trước" },
  ];
  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}><Card><Statistic title="Tổng bài đăng" value={metrics.totalPosts} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Lượt xem" value={metrics.totalViews} prefix={<EyeOutlined />} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Yêu thích" value={metrics.totalFavorites} prefix={<HeartOutlined />} /></Card></Col>
        <Col xs={24} md={6}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#8c8c8c" }}>Tương tác</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{metrics.engagementRate}%</div>
              </div>
              <div style={{ width: 120 }}>
                <Progress type="circle" percent={metrics.engagementRate} size={80} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Tương tác gần đây" style={{ marginTop: 16 }}>
        <List
          dataSource={recent}
          renderItem={(it) => (
            <List.Item
              actions={[
                <span key="v"><EyeOutlined /> {it.views}</span>,
                <span key="l"><LikeOutlined /> {it.likes}</span>,
                <span key="f"><HeartOutlined /> {it.favs}</span>,
              ]}
            >
              <List.Item.Meta
                title={<Link to={`/listing/${it.id}`}>{it.title}</Link>}
                description={<Text type="secondary">{it.time}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

/* --- Quản lý bài đăng --- */
function ManagePostsTab({ isAdmin }) {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { token, user } = useAuth() || {};
  const myEmail = String(user?.email || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);

  // Lấy danh sách bài đăng
  useEffect(() => {
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
          const typeKey = String(p.businessType || "").toLowerCase().trim();
          const ownerEmail = (p.ownerEmail || p.user?.email || "").toString();
          return {
            id: p.id,
            title: p.title || "Không có tiêu đề",
            businessType: TYPE_LABEL[typeKey] || p.businessType || "Khác",
            price: Number(p.price) || 0,
            area_m2: Number(p.areaM2 ?? p.area_m2) || 0,
            address: p.locationText || p.address || "",
            createdAt: p.createdAt || p.created_at || "",
            img: p.coverImage || (Array.isArray(p.images) && p.images[0]) || PLACEHOLDER_IMG,
            ownerEmail,
          };
        });

        // Nếu không phải admin → lọc theo email của mình
        const filtered = isAdmin || !myEmail
          ? mapped
          : mapped.filter((x) => x.ownerEmail.toLowerCase() === myEmail);

        if (!aborted) setRows(filtered);
      } catch (e) {
        if (!aborted) {
          setErr(e.message || "Fetch error");
          messageApi.error("Không tải được danh sách bài đăng.");
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
  }, [isAdmin, myEmail, messageApi]);

  const onDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/premises/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 204) {
        setRows((xs) => xs.filter((x) => x.id !== id));
        messageApi.success("Đã xoá bài đăng.");
      } else {
        const txt = await res.text().catch(() => "");
        throw new Error(`Xoá thất bại (${res.status}) ${txt}`);
      }
    } catch (e) {
      messageApi.error(e.message || "Không xoá được bài đăng");
    }
  };

  const columns = [
    {
      title: "Bìa",
      dataIndex: "img",
      width: 110,
      render: (src, r) => (
        <Link to={`/listing/${r.id}`}>
          <img
            src={src}
            alt=""
            style={{ width: 92, height: 56, objectFit: "cover", borderRadius: 6 }}
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
          />
        </Link>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      width: 360,
      render: (t, r) => (
        <Link to={`/listing/${r.id}`}>
          <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2, tooltip: t }}>
            {t}
          </Paragraph>
        </Link>
      ),
    },
    {
      title: "Người đăng",
      dataIndex: "ownerEmail",
      width: 220,
      render: (v) => (v ? <a href={`mailto:${v}`}>{v}</a> : <Text type="secondary">n/a</Text>),
    },
    { title: "Loại hình", dataIndex: "businessType", width: 120, render: (s) => <Tag>{s}</Tag> },
    { title: "Giá", dataIndex: "price", width: 130, render: (v) => currency(v) },
    { title: "Diện tích", dataIndex: "area_m2", width: 110, render: (v) => `${v} m²` },
    { title: "Địa chỉ", dataIndex: "address", ellipsis: true },
    {
      title: "Thao tác",
      key: "actions",
      width: 210,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/post?edit=${r.id}`)}>
            Sửa
          </Button>
          <Popconfirm title="Xoá bài này?" onConfirm={() => onDelete(r.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {contextHolder}
      <Card
        title={isAdmin ? "Tất cả bài đăng" : "Bài đăng của tôi"}
        extra={
          <Button type="primary">
            <Link to="/post" style={{ color: "#fff" }}>
              Đăng bài mới
            </Link>
          </Button>
        }
      >
        {err ? (
          <Empty description="Không thể tải dữ liệu" />
        ) : (
          <Table
            rowKey="id"
            dataSource={rows}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1100 }}
          />
        )}
      </Card>
    </div>
  );
}

/* --- Bài viết yêu thích --- */
function FavoritePostsTab() {
  const favTop = getAllFavorites();
  return (
    <div style={{ padding: 16 }}>
      <Card title="Bài viết bạn đã yêu thích">
        {favTop.length === 0 ? (
          <Empty description="Chưa có lượt yêu thích. Vào chi tiết tin để bấm ❤ nhé!" />
        ) : (
          <List
            dataSource={favTop}
            renderItem={(it) => (
              <List.Item actions={[<Tag color="red" key="fav">❤ {it.count}</Tag>]}>
                <List.Item.Meta
                  title={<Link to={`/listing/${it.id}`}>Tin #{it.id}</Link>}
                  description="(Demo) Khi nối BE sẽ hiện tiêu đề/ảnh."
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}

/* --- Đổi mật khẩu --- */
function ChangePasswordTab() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const { token } = useAuth() || {};
  const [loading, setLoading] = useState(false);

  async function changePasswordAPI(token, { oldPassword, newPassword }) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Đổi mật khẩu thất bại (${res.status})`);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  const onFinish = async (vals) => {
    if (!token) {
      messageApi.error("Bạn cần đăng nhập lại (thiếu token).");
      return;
    }
    if (vals.next !== vals.confirm) {
      messageApi.warning("Mật khẩu nhập lại không khớp.");
      return;
    }
    try {
      setLoading(true);
      await changePasswordAPI(token, { oldPassword: vals.current, newPassword: vals.next });
      messageApi.success("Đổi mật khẩu thành công!");
      form.resetFields();
    } catch (e) {
      messageApi.error(e.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {contextHolder}
      <Card title="Đổi mật khẩu">
        <Form form={form} layout="vertical" style={{ maxWidth: 420 }} onFinish={onFinish}>
          <Form.Item name="current" label="Mật khẩu hiện tại" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="next" label="Mật khẩu mới" rules={[{ required: true }, { min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Nhập lại"
            dependencies={["next"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  return !v || v === getFieldValue("next")
                    ? Promise.resolve()
                    : Promise.reject(new Error("Không khớp"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Cập nhật
          </Button>
        </Form>
      </Card>
    </div>
  );
}

/* --- Biểu đồ tổng quan (Admin) --- */
function AdminChartsTab() {
  return (
    <div style={{ padding: 16 }}>
      <AdminAnalytics days={30} />
    </div>
  );
}

/* --- Component chính --- */
export default function Dashboard() {
  const role = useRole();
  const isAdmin = role === "admin";

  const items = useMemo(() => {
    const base = [
      { key: "overview", label: "Tổng quan", children: <OverviewTab /> },
      { key: "manage", label: "Quản lý bài đăng", children: <ManagePostsTab isAdmin={isAdmin} /> },
      { key: "fav", label: "Bài viết yêu thích", children: <FavoritePostsTab /> },
      { key: "pwd", label: "Đổi mật khẩu", children: <ChangePasswordTab /> },
    ];
    if (isAdmin)
      base.unshift({ key: "charts", label: "Biểu đồ tổng quan (Admin)", children: <AdminChartsTab /> });
    return base;
  }, [isAdmin]);

  return (
    <div style={{ maxWidth: 1200, margin: "16px auto", padding: "0 16px" }}>
      <Title level={3} style={{ marginBottom: 12 }}>
        Dashboard {isAdmin ? <Tag color="geekblue">Admin</Tag> : <Tag>Mặc định</Tag>}
      </Title>
      <Tabs defaultActiveKey={isAdmin ? "charts" : "overview"} items={items} />
    </div>
  );
}
