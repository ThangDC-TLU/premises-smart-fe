import { useState } from "react";
import { Card, Form, Input, Button, Checkbox, Typography, App } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form] = Form.useForm();
  const nav = useNavigate();
  const { login, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  // Lấy instance message từ Provider, ĐỔI TÊN để tránh đụng
  const { message: msg } = App.useApp();

  const pickError = (errLike) => {
    if (!errLike) return "Đăng nhập thất bại";
    if (typeof errLike === "string") return errLike;
    if (typeof errLike?.message === "string" && errLike.message.trim()) return errLike.message.trim();
    return "Đăng nhập thất bại";
  };

  const onFinish = async (values) => {
    const { email, password } = values || {};
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res?.ok) {
        await msg.success("Đăng nhập thành công!", 1.2);
        nav("/", { replace: true });
      } else {
        const errText = pickError(res?.error);
        msg.error(errText);
        form.setFieldsValue({ password: "" });
      }
    } catch (e) {
      msg.error(pickError(e));
      form.setFieldsValue({ password: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = ({ errorFields }) => {
    if (errorFields?.length) {
      msg.error(errorFields[0]?.errors?.[0] || "Vui lòng kiểm tra thông tin");
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
          onFinishFailed={onFinishFailed}
          initialValues={{ remember: true }}
          autoComplete="on"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" autoComplete="email" allowClear />
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
              visibilityToggle
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Nhớ đăng nhập</Checkbox>
            </Form.Item>
            <Link to="/forgot">Quên mật khẩu?</Link>
          </div>

          <Button type="primary" htmlType="submit" block loading={loading || submitting} disabled={loading || submitting}>
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
