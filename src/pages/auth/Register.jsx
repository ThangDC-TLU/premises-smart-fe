import { useState } from "react";
import { Card, Form, Input, Button, Checkbox, Typography, message } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { register: registerUser, loading } = useAuth(); // register(payload) -> { ok, error }
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    const { fullName, email, phone, password } = values;
    setSubmitting(true);
    const res = await registerUser({ fullName, email, phone, password });
    setSubmitting(false);

    if (res.ok) {
      message.success("Tạo tài khoản thành công! Vui lòng đăng nhập.");
      nav("/login");
    } else {
      const err =
        typeof res.error === "string"
          ? res.error
          : res.error?.message || "Đăng ký thất bại";
      message.error(err);
    }
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
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Nhập số điện thoại" },
              {
                pattern: /^(0|\+84)(\d{9}|(\d{2}\d{7}))$/,
                message: "Số điện thoại Việt Nam không hợp lệ",
              },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="0912345678" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Nhập mật khẩu" },
              { min: 6, message: "Tối thiểu 6 ký tự" },
            ]}
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

          <Form.Item
            name="agree"
            valuePropName="checked"
            rules={[{ validator:(_,v)=> v ? Promise.resolve() : Promise.reject(new Error("Bạn cần đồng ý điều khoản")) }]}
          >
            <Checkbox>Tôi đồng ý với điều khoản sử dụng</Checkbox>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading || submitting}
          >
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
