import { Card, Typography, Button } from "antd";
import { Link } from "react-router-dom";

export default function Logout() {
  return (
    <div style={{ display:"grid", placeItems:"center", padding:"48px 16px" }}>
      <Card style={{ width: 380, textAlign:"center" }}>
        <Typography.Title level={4}>Đăng xuất</Typography.Title>
        <Typography.Paragraph>Đây là giao diện minh hoạ. Chưa xử lý logic.</Typography.Paragraph>
        <Button type="primary">
          <Link to="/" style={{ color:"#fff" }}>Về trang chủ</Link>
        </Button>
      </Card>
    </div>
  );
}
