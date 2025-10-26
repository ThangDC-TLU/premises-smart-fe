import { Card, Form, Input, Button, Checkbox, Typography, message } from "antd";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();

  const onFinish = (values) => {
    message.success("Demo: đăng ký thành công (UI)");
    nav("/login");
  };

  return (
    <div style={{ display:"grid", placeItems:"center", padding:"48px 16px" }}>
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ textAlign:"center", marginBottom: 8 }}>
          Tạo tài khoản
        </Typography.Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Nhập họ tên" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>

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

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu" }, { min: 6, message: "Tối thiểu 6 ký tự" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="Nhập lại mật khẩu"
            name="confirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Nhập lại mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu không khớp"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item name="agree" valuePropName="checked"
            rules={[{ validator:(_,v)=> v ? Promise.resolve() : Promise.reject(new Error("Bạn cần đồng ý điều khoản")) }]}>
            <Checkbox>Tôi đồng ý với điều khoản sử dụng</Checkbox>
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Tạo tài khoản
          </Button>

          <div style={{ textAlign:"center", marginTop: 12 }}>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
