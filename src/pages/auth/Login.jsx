import { Card, Form, Input, Button, Checkbox, Typography } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

export default function Login() {
  return (
    <div style={{ display:"grid", placeItems:"center", padding:"48px 16px" }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign:"center", marginBottom: 8 }}>
          Đăng nhập
        </Typography.Title>

        <Form layout="vertical" onFinish={() => {}} initialValues={{ remember: true }}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Nhập email" }]}>
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>

          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 8 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Nhớ đăng nhập</Checkbox>
            </Form.Item>
            <a href="#">Quên mật khẩu?</a>
          </div>

          <Button type="primary" htmlType="submit" block>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}
