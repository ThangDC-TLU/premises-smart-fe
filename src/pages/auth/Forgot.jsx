import { Card, Form, Input, Button, Typography, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export default function Forgot() {
  const onFinish = (values) => {
    message.success(`Demo: đã gửi hướng dẫn tới ${values.email}`);
  };

  return (
    <div style={{ display:"grid", placeItems:"center", padding:"48px 16px" }}>
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ textAlign:"center", marginBottom: 8 }}>
          Quên mật khẩu
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign:"center" }}>
          Nhập email để nhận liên kết đặt lại mật khẩu.
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Gửi yêu cầu
          </Button>

          <div style={{ textAlign:"center", marginTop: 12 }}>
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
