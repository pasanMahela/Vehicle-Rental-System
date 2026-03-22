import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Progress, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import {
  CarOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  ToolOutlined,
  BellOutlined,
  UserOutlined,
  ArrowUpOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getAllVehicles } from '../api/vehicleApi';
import { getAllBookings } from '../api/bookingApi';
import { getAllPayments } from '../api/paymentApi';

const { Title, Text } = Typography;

const ROLE_LABELS = {
  CUSTOMER: 'Customer',
  BOOKING_CASHIER: 'Booking Cashier',
  REPAIR_ADVISOR: 'Repair Advisor',
  OWNER: 'Owner',
};

const ROLE_DESCRIPTIONS = {
  CUSTOMER: 'Browse vehicles, make bookings, and track your payments.',
  BOOKING_CASHIER: 'Manage bookings, process payments, and handle customer reservations.',
  REPAIR_ADVISOR: 'Manage vehicle maintenance, inspections, and damage reports.',
  OWNER: 'Full system access — manage users, vehicles, bookings, payments, and maintenance.',
};

function formatLKR(value) {
  return `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    revenue: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [vehiclesRes, bookingsRes, paymentsRes] = await Promise.all([
          getAllVehicles(),
          getAllBookings(),
          getAllPayments(),
        ]);

        const vehicles = vehiclesRes?.data ?? [];
        const bookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
        const payments = Array.isArray(paymentsRes?.data) ? paymentsRes.data : [];

        const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length;
        const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
        const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
        const revenue = payments
          .filter((p) => p.paymentStatus === 'SUCCESS')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const pendingPayments = payments.filter((p) => p.paymentStatus === 'PENDING').length;

        setStats({
          totalVehicles: vehicles.length,
          availableVehicles,
          totalBookings: bookings.length,
          activeBookings,
          completedBookings,
          revenue,
          pendingPayments,
        });
      } catch (err) {
        notification?.error?.({
          message: 'Failed to load dashboard data',
          description: err?.response?.data?.message || err?.message || 'Please try again later.',
        });
        setStats({ totalVehicles: 0, availableVehicles: 0, totalBookings: 0, activeBookings: 0, completedBookings: 0, revenue: 0, pendingPayments: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [notification]);

  const quickActions = [];
  quickActions.push({
    key: 'vehicles',
    title: 'Vehicles',
    description: 'Browse and manage vehicles',
    icon: <CarOutlined style={{ fontSize: 24 }} />,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    to: '/dashboard/vehicles',
  });
  quickActions.push({
    key: 'bookings',
    title: 'Bookings',
    description: 'View and manage reservations',
    icon: <CalendarOutlined style={{ fontSize: 24 }} />,
    color: '#10b981',
    bgColor: '#ecfdf5',
    to: '/dashboard/bookings',
  });
  if (hasRole('CUSTOMER', 'BOOKING_CASHIER', 'OWNER')) {
    quickActions.push({
      key: 'payments',
      title: 'Payments',
      description: 'Track payment transactions',
      icon: <CreditCardOutlined style={{ fontSize: 24 }} />,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      to: '/dashboard/payments',
    });
  }
  if (hasRole('REPAIR_ADVISOR', 'OWNER')) {
    quickActions.push({
      key: 'maintenance',
      title: 'Maintenance',
      description: 'Vehicle maintenance & inspections',
      icon: <ToolOutlined style={{ fontSize: 24 }} />,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      to: '/dashboard/maintenance',
    });
  }
  if (hasRole('CUSTOMER', 'BOOKING_CASHIER', 'OWNER')) {
    quickActions.push({
      key: 'notifications',
      title: 'Notifications',
      description: 'System alerts and messages',
      icon: <BellOutlined style={{ fontSize: 24 }} />,
      color: '#06b6d4',
      bgColor: '#ecfeff',
      to: '/dashboard/notifications',
    });
  }
  if (user?.role === 'OWNER') {
    quickActions.push({
      key: 'users',
      title: 'Users',
      description: 'Manage system users and roles',
      icon: <UserOutlined style={{ fontSize: 24 }} />,
      color: '#ec4899',
      bgColor: '#fdf2f8',
      to: '/dashboard/users',
    });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  const vehicleUsagePercent = stats.totalVehicles > 0 
    ? Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100) 
    : 0;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Section */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          borderRadius: 20,
          padding: '32px 40px',
          marginBottom: 24,
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 100, width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4, display: 'block' }}>
            Welcome back,
          </Text>
          <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
            {user?.username ?? 'User'}
          </Title>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span 
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '6px 16px', 
                borderRadius: 20, 
                fontSize: 13,
                fontWeight: 500
              }}
            >
              {ROLE_LABELS[user?.role]}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              {ROLE_DESCRIPTIONS[user?.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* Revenue Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%'
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div 
                style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CreditCardOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
              <Tooltip title="Total revenue from successful payments">
                <span style={{ color: '#10b981', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowUpOutlined /> Revenue
                </span>
              </Tooltip>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
              {formatLKR(stats.revenue)}
            </div>
            <Text type="secondary">Total Revenue</Text>
          </Card>
        </Col>

        {/* Vehicles Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%'
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div 
                style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CarOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
              {stats.totalVehicles}
            </div>
            <Text type="secondary">Total Vehicles</Text>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Fleet Utilization</Text>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>{vehicleUsagePercent}%</Text>
              </div>
              <Progress 
                percent={vehicleUsagePercent} 
                showInfo={false} 
                strokeColor="#3b82f6" 
                trailColor="#e5e7eb"
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {stats.availableVehicles} available
              </Text>
            </div>
          </Card>
        </Col>

        {/* Bookings Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%'
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div 
                style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CalendarOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
              {stats.totalBookings}
            </div>
            <Text type="secondary">Total Bookings</Text>
            <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>{stats.activeBookings}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>Active</Text>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>{stats.completedBookings}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>Completed</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Pending Payments Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%'
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div 
                style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BellOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
              {stats.pendingPayments}
            </div>
            <Text type="secondary">Pending Payments</Text>
            <div style={{ marginTop: 12 }}>
              <Text 
                type="secondary" 
                style={{ fontSize: 12, cursor: 'pointer', color: '#3b82f6' }}
                onClick={() => navigate('/dashboard/payments')}
              >
                View all payments →
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16, fontWeight: 600 }}>Quick Actions</Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={24} sm={12} md={8} lg={4} key={action.key}>
              <Card
                hoverable
                onClick={() => navigate(action.to)}
                style={{ 
                  borderRadius: 16, 
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                styles={{ body: { padding: 20, textAlign: 'center' } }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
                }}
              >
                <div 
                  style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 16, 
                    background: action.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: action.color
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#1f2937' }}>
                  {action.title}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {action.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Footer Info */}
      <Card
        style={{ 
          borderRadius: 16, 
          border: 'none',
          background: '#f8fafc',
          boxShadow: 'none'
        }}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Text type="secondary">Need help? Check our documentation or contact support.</Text>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span 
              style={{ 
                background: '#ffffff', 
                padding: '8px 16px', 
                borderRadius: 8, 
                fontSize: 13,
                fontWeight: 500,
                color: '#3b82f6',
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
            >
              Documentation
            </span>
            <span 
              style={{ 
                background: '#3b82f6', 
                padding: '8px 16px', 
                borderRadius: 8, 
                fontSize: 13,
                fontWeight: 500,
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Get Support
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
