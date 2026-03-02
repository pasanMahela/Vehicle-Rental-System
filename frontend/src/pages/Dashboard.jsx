import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import {
  CarOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  ToolOutlined,
  BellOutlined,
  UserOutlined,
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
    totalBookings: 0,
    activeBookings: 0,
    revenue: 0,
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

        const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
        const revenue = payments
          .filter((p) => p.paymentStatus === 'SUCCESS')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        setStats({
          totalVehicles: vehicles.length,
          totalBookings: bookings.length,
          activeBookings,
          revenue,
        });
      } catch (err) {
        notification?.error?.({
          message: 'Failed to load dashboard data',
          description: err?.response?.data?.message || err?.message || 'Please try again later.',
        });
        setStats({ totalVehicles: 0, totalBookings: 0, activeBookings: 0, revenue: 0 });
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
    icon: <CarOutlined className="text-xl" />,
    gradient: 'from-blue-500 to-cyan-500',
    to: '/dashboard/vehicles',
  });
  quickActions.push({
    key: 'bookings',
    title: 'Bookings',
    description: 'View and manage reservations',
    icon: <CalendarOutlined className="text-xl" />,
    gradient: 'from-green-500 to-emerald-600',
    to: '/dashboard/bookings',
    roles: ['CUSTOMER', 'BOOKING_CASHIER', 'REPAIR_ADVISOR', 'OWNER'],
  });
  if (hasRole('CUSTOMER', 'BOOKING_CASHIER', 'OWNER')) {
    quickActions.push({
      key: 'payments',
      title: 'Payments',
      description: 'Track payment transactions',
      icon: <CreditCardOutlined className="text-xl" />,
      gradient: 'from-violet-500 to-purple-600',
      to: '/dashboard/payments',
    });
  }
  if (hasRole('REPAIR_ADVISOR', 'OWNER')) {
    quickActions.push({
      key: 'maintenance',
      title: 'Maintenance',
      description: 'Vehicle maintenance & inspections',
      icon: <ToolOutlined className="text-xl" />,
      gradient: 'from-orange-500 to-amber-600',
      to: '/dashboard/maintenance',
    });
  }
  if (hasRole('CUSTOMER', 'BOOKING_CASHIER', 'OWNER')) {
    quickActions.push({
      key: 'notifications',
      title: 'Notifications',
      description: 'System alerts and messages',
      icon: <BellOutlined className="text-xl" />,
      gradient: 'from-cyan-500 to-teal-600',
      to: '/dashboard/notifications',
    });
  }
  if (user?.role === 'OWNER') {
    quickActions.push({
      key: 'users',
      title: 'Users',
      description: 'Manage system users and roles',
      icon: <UserOutlined className="text-xl" />,
      gradient: 'from-rose-500 to-red-600',
      to: '/dashboard/users',
    });
  }

  const statCards = [
    {
      key: 'vehicles',
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: <CarOutlined className="text-2xl" />,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'bookings',
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: <CalendarOutlined className="text-2xl" />,
      gradient: 'from-green-500 to-teal-600',
    },
    {
      key: 'active',
      title: 'Active Bookings',
      value: stats.activeBookings,
      icon: <CalendarOutlined className="text-2xl" />,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      key: 'revenue',
      title: 'Revenue',
      value: formatLKR(stats.revenue),
      icon: <CreditCardOutlined className="text-2xl" />,
      gradient: 'from-emerald-500 to-green-700',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <Title level={2} className="!mb-1 !font-semibold">
          Welcome, {user?.username ?? 'User'}!
        </Title>
        <Text type="secondary" className="text-base">
          {ROLE_LABELS[user?.role] && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mr-2">
              {ROLE_LABELS[user?.role]}
            </span>
          )}
          {ROLE_DESCRIPTIONS[user?.role] ?? 'Manage your vehicle rental activities.'}
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <Card
              className={`overflow-hidden transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br ${card.gradient} shadow-lg`}
              styles={{ body: { padding: '20px' } }}
            >
              <div className="flex items-start justify-between">
                <Statistic
                  title={<span className="text-white/90 text-sm font-medium">{card.title}</span>}
                  value={card.value}
                  valueStyle={{ color: 'white', fontWeight: 700, fontSize: '1.5rem' }}
                />
                <div className="rounded-xl bg-white/20 p-3 text-white">{card.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Action Cards */}
      <div>
        <Title level={4} className="!mb-4">
          Quick Actions
        </Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={24} sm={12} md={8} lg={6} key={action.key}>
              <Card
                hoverable
                className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => navigate(action.to)}
              >
                <div
                  className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-br ${action.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
                />
                <div className="relative flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${action.gradient} text-white shadow-md`}
                  >
                    {action.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-base mb-1">{action.title}</div>
                    <Text type="secondary" className="text-sm">
                      {action.description}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
