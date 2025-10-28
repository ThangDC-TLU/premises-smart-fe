import { useState } from "react";
import { Card, Form, Input, Button, Checkbox, Typography, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext"; // đường dẫn tùy cấu trúc của bạn
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form] = Form.useForm();
  const nav = useNavigate();
  const { login, loading } = useAuth(); // login(email, password) -> { ok, error }
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    const { email, password } = values || {};
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.ok) {
      message.success("Đăng nhập thành công!");
      nav("/", { replace: true });
    } else {
      const err =
        typeof res.error === "string"
          ? res.error
          : res.error?.message || "Đăng nhập thất bại";
      message.error(err);
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", padding: "48px 16px" }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
          Đăng nhập
        </Typography.Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ remember: true }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Nhớ đăng nhập</Checkbox>
            </Form.Item>
            <Link to="/forgot">Quên mật khẩu?</Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading || submitting}
          >
            Đăng nhập
          </Button>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
