import { useMemo, useState } from "react";
import {
  Tabs, Card, Row, Col, Statistic, Progress, Tag, List, Button, Space,
  Table, Typography, Popconfirm, message, Form, Input, Empty
} from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  EyeOutlined, HeartOutlined, LikeOutlined, EditOutlined, DeleteOutlined,
  BarChartOutlined, LockOutlined
} from "@ant-design/icons";
import { getAllFavorites } from "../utils/favorites";

const { Title, Paragraph, Text } = Typography;

/* --- Lấy role qua query: /dashboard?role=admin --- */
function useRole() {
  const qs = new URLSearchParams(useLocation().search);
  return (qs.get("role") || "user").toLowerCase(); // "user" | "admin"
}

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
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ color:"#8c8c8c" }}>Tương tác</div><div style={{ fontSize:22,fontWeight:700 }}>{metrics.engagementRate}%</div></div>
              <div style={{ width:120 }}><Progress type="circle" percent={metrics.engagementRate} size={80} /></div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Tương tác gần đây" style={{ marginTop: 16 }}>
        <List
          dataSource={recent}
          renderItem={(it) => (
            <List.Item actions={[<span key="v"><EyeOutlined /> {it.views}</span>, <span key="l"><LikeOutlined /> {it.likes}</span>, <span key="f"><HeartOutlined /> {it.favs}</span>]}>
              <List.Item.Meta title={<Link to={`/listing/${it.id}`}>{it.title}</Link>} description={<Text type="secondary">{it.time}</Text>} />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

/* --- Quản lý bài đăng --- */
function ManagePostsTab() {
  const [data, setData] = useState([
    { id: "p01", title: "Mặt bằng Q.1 góc 2 MT", status: "Đang hiển thị", views: 523, favs: 21, createdAt: "2025-10-01" },
    { id: "p02", title: "Văn phòng Q.3 80m²",   status: "Nháp",          views:  92, favs:  5, createdAt: "2025-10-05" },
    { id: "p03", title: "Kho Q.7 120m²",        status: "Đang hiển thị", views: 287, favs: 11, createdAt: "2025-10-08" },
  ]);

  const columns = [
    { title: "Tiêu đề", dataIndex: "title", render: (t, r) => <Link to={`/listing/${r.id}`}>{t}</Link> },
    { title: "Trạng thái", dataIndex: "status", render: s => <Tag color={s === "Đang hiển thị" ? "green" : "default"}>{s}</Tag> },
    { title: <><EyeOutlined /> Xem</>, dataIndex: "views", width: 110 },
    { title: "Yêu thích", dataIndex: "favs", width: 110 },
    { title: "Tạo lúc", dataIndex: "createdAt", width: 130 },
    {
      title: "Thao tác", key: "actions", width: 220,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>Sửa</Button>
          <Button size="small" onClick={()=>{
            setData(ds => ds.map(x => x.id===r.id ? ({...x, status: x.status==="Đang hiển thị"?"Nháp":"Đang hiển thị"}) : x));
            message.success("Đã chuyển trạng thái (demo)");
          }}>{r.status==="Đang hiển thị"?"Ẩn":"Hiển thị"}</Button>
          <Popconfirm title="Xoá bài này?" onConfirm={()=>{ setData(ds=>ds.filter(x=>x.id!==r.id)); message.success("Đã xoá (demo)"); }}>
            <Button danger size="small" icon={<DeleteOutlined />}>Xoá</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="Bài đăng của tôi" extra={<Button type="primary"><Link to="/post" style={{ color:"#fff" }}>Đăng bài mới</Link></Button>}>
        <Table rowKey="id" dataSource={data} columns={columns} pagination={{ pageSize: 5 }} />
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
                <List.Item.Meta title={<Link to={`/listing/${it.id}`}>Tin #{it.id}</Link>} description="(Demo) Khi nối BE sẽ hiện tiêu đề/ảnh." />
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
  const [form] = Form.useForm();
  return (
    <div style={{ padding: 16 }}>
      <Card title="Đổi mật khẩu">
        <Form form={form} layout="vertical" style={{ maxWidth: 420 }} onFinish={() => { message.success("Demo: đã cập nhật"); form.resetFields(); }}>
          <Form.Item name="current" label="Mật khẩu hiện tại" rules={[{ required: true }]}><Input.Password prefix={<LockOutlined />} /></Form.Item>
          <Form.Item name="next" label="Mật khẩu mới" rules={[{ required: true }, { min: 6 }]}><Input.Password prefix={<LockOutlined />} /></Form.Item>
          <Form.Item name="confirm" label="Nhập lại" dependencies={["next"]} rules={[{ required: true }, ({getFieldValue})=>({validator(_,v){return !v||v===getFieldValue("next")?Promise.resolve():Promise.reject(new Error("Không khớp"));}})]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit">Cập nhật</Button>
        </Form>
      </Card>
    </div>
  );
}

/* --- Biểu đồ tổng quan (Admin) --- */
function AdminChartsTab() {
  const data = { posts:1245, users:892, viewsToday:15432, convRate:7.2, byType:[{type:"F&B",value:38},{type:"Văn phòng",value:27},{type:"Bán lẻ",value:22},{type:"Kho bãi",value:13}] };
  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16,16]}>
        <Col xs={24} md={6}><Card><Statistic title="Tổng bài đăng" value={data.posts} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Người dùng" value={data.users} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Lượt xem hôm nay" value={data.viewsToday} prefix={<EyeOutlined />} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Tỷ lệ chuyển đổi" value={data.convRate} suffix="%" /></Card></Col>
      </Row>
      <Card title={<>Cơ cấu loại hình <Tag color="blue"><BarChartOutlined /> demo</Tag></>} style={{ marginTop: 16 }}>
        <Row gutter={[12,12]}>
          {data.byType.map((b) => (
            <Col xs={24} md={12} lg={6} key={b.type}>
              <Card size="small">
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <Text strong>{b.type}</Text><Text>{b.value}%</Text>
                </div>
                <Progress percent={b.value} showInfo={false} />
              </Card>
            </Col>
          ))}
        </Row>
        <Paragraph type="secondary" style={{ marginTop:8 }}>*Demo – khi nối Superset, nhúng iframe vào đây.</Paragraph>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const role = useRole();
  const isAdmin = role === "admin";

  const items = useMemo(() => {
    const base = [
      { key: "overview", label: "Tổng quan", children: <OverviewTab /> },
      { key: "manage",   label: "Quản lý bài đăng", children: <ManagePostsTab /> },
      { key: "fav",      label: "Bài viết yêu thích", children: <FavoritePostsTab /> },
      { key: "pwd",      label: "Đổi mật khẩu", children: <ChangePasswordTab /> },
    ];
    if (isAdmin) base.unshift({ key: "charts", label: "Biểu đồ tổng quan (Admin)", children: <AdminChartsTab /> });
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
