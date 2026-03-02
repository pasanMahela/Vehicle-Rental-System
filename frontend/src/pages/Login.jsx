import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { message } = App.useApp();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { data } = await login(values);
      loginUser(
        { userId: data.userId, username: data.username, role: data.role },
        data.token
      );
      message.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      message.error(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 p-4">
      <Card
        className="w-full max-w-md shadow-xl"
        styles={{ body: { padding: '2rem 2rem' } }}
      >
        <div className="text-center mb-8">
          <Typography.Title level={2} className="!mb-2">
            Vehicle Rental System
          </Typography.Title>
          <Typography.Text type="secondary">
            Sign in to your account
          </Typography.Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Username"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="h-12"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Typography.Text className="text-center block">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[#1677ff] hover:underline">
            Register
          </Link>
        </Typography.Text>
      </Card>
    </div>
  );
}
