import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Steps, Typography, App } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { register, verifyEmail, resendCode } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { message } = App.useApp();

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const { data } = await register(values);
      setUserId(data.userId);
      setEmail(values.email);
      setCurrentStep(1);
      message.success(data.message || 'Verification code sent to your email');
    } catch (err) {
      message.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      message.error('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await verifyEmail({ userId, code: fullCode });
      loginUser(
        { userId: data.userId, username: data.username, role: data.role },
        data.token
      );
      message.success('Account verified successfully!');
      navigate('/dashboard');
    } catch (err) {
      message.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { data } = await resendCode({ userId });
      message.success(data.message || 'Code resent to your email');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const steps = [
    { title: 'Account', icon: <UserOutlined /> },
    { title: 'Verify', icon: <SafetyCertificateOutlined /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 p-4">
      <Card
        className="w-full max-w-md shadow-xl"
        styles={{ body: { padding: '2rem 2rem' } }}
      >
        <div className="text-center mb-6">
          <Typography.Title level={2} className="!mb-2">
            Create Account
          </Typography.Title>
          <Typography.Text type="secondary">
            Register for Vehicle Rental System
          </Typography.Text>
        </div>

        <Steps current={currentStep} items={steps} className="mb-8" />

        {currentStep === 0 ? (
          <>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleRegister}
              size="large"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Please choose a username' },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Username"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Please choose a password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Password (min 6 characters)"
                  autoComplete="new-password"
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
                  Create Account
                </Button>
              </Form.Item>
            </Form>

            <Typography.Text className="text-center block">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1677ff] hover:underline">
                Sign In
              </Link>
            </Typography.Text>
          </>
        ) : (
          <>
            <Typography.Text type="secondary" className="block text-center mb-4">
              We sent a 6-digit code to <strong>{email}</strong>
            </Typography.Text>

            <div className="flex justify-center gap-2 mb-6">
              {code.map((digit, i) => (
                <Input
                  key={i}
                  id={`otp-${i}`}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  className="w-12 h-14 text-center text-lg font-semibold"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              disabled={code.join('').length !== 6}
              onClick={handleVerify}
              className="h-12 mb-4"
            >
              Verify & Continue
            </Button>

            <div className="text-center">
              <Typography.Text type="secondary" className="mr-2">
                Didn&apos;t receive the code?
              </Typography.Text>
              <Button type="link" onClick={handleResend} className="p-0 h-auto">
                Resend Code
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
