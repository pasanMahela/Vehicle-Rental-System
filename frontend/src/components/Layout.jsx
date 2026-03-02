import { useEffect, useState, useCallback } from 'react';
import { Layout as AntLayout, Menu, Avatar, Badge, Popover, Button, Typography, App } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  ToolOutlined,
  BellOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  CheckOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notificationApi';

const { Header, Sider, Content } = AntLayout;

const NOTIF_TYPE_ROUTES = {
  BOOKING_CONFIRMATION: '/dashboard/bookings',
  BOOKING_CANCELLATION: '/dashboard/bookings',
  BOOKING_REMINDER: '/dashboard/bookings',
  PAYMENT_SUCCESS: '/dashboard/payments',
  PAYMENT_FAILURE: '/dashboard/payments',
  MAINTENANCE_ALERT: '/dashboard/maintenance',
  DAMAGE_CHARGE: '/dashboard/payments',
};

function getNavItems(hasRole) {
  const items = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/dashboard/vehicles', icon: <CarOutlined />, label: 'Vehicles' },
    { key: '/dashboard/bookings', icon: <CalendarOutlined />, label: 'Bookings' },
  ];

  if (hasRole('CUSTOMER') || hasRole('BOOKING_CASHIER') || hasRole('OWNER')) {
    items.push({ key: '/dashboard/payments', icon: <CreditCardOutlined />, label: 'Payments' });
  }

  if (hasRole('REPAIR_ADVISOR') || hasRole('OWNER')) {
    items.push({ key: '/dashboard/maintenance', icon: <ToolOutlined />, label: 'Maintenance' });
  }

  if (hasRole('CUSTOMER') || hasRole('BOOKING_CASHIER') || hasRole('OWNER')) {
    items.push({ key: '/dashboard/notifications', icon: <BellOutlined />, label: 'Notifications' });
  }

  if (hasRole('OWNER')) {
    items.push({ key: '/dashboard/users', icon: <TeamOutlined />, label: 'Users' });
    items.push({ key: '/dashboard/settings', icon: <SettingOutlined />, label: 'Settings' });
  }

  return items;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  const [unreadCount, setUnreadCount] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const { data } = await getUnreadCount(user.userId);
      setUnreadCount(data.count ?? 0);
    } catch {
      /* silent */
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const fetchNotifications = async () => {
    if (!user?.userId) return;
    setLoadingNotifs(true);
    try {
      const { data } = await getUserNotifications(user.userId);
      setNotifications(data?.slice(0, 20) ?? []);
    } catch {
      /* silent */
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleBellClick = () => {
    if (popoverOpen) {
      setPopoverOpen(false);
    } else {
      setPopoverOpen(true);
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (e, notif) => {
    e?.stopPropagation();
    try {
      await markAsRead(notif.notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notif.notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* silent */
    }
  };

  const handleClickNotification = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif.notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notif.notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    const route = NOTIF_TYPE_ROUTES[notif.notificationType];
    if (route) {
      setPopoverOpen(false);
      navigate(route);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.userId) return;
    try {
      await markAllAsRead(user.userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = getNavItems(hasRole);

  const notificationContent = (
    <div className="w-[320px]">
      <div className="flex items-center justify-between mb-3">
        <Typography.Text strong>Notifications</Typography.Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={handleMarkAllRead}
            className="p-0 h-auto"
          >
            Mark all read
          </Button>
        )}
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {loadingNotifs && notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Typography.Text type="secondary">Loading...</Typography.Text>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Typography.Text type="secondary">No notifications</Typography.Text>
          </div>
        ) : (
          <div className="space-y-0">
            {notifications.map((notif) => (
              <div
                key={notif.notificationId}
                className={`flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors rounded ${
                  notif.read
                    ? 'hover:bg-gray-50'
                    : 'bg-blue-50 hover:bg-blue-100'
                }`}
                onClick={() => handleClickNotification(notif)}
              >
                <div className="mt-1 flex-shrink-0">
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wide block"
                  >
                    {(notif.notificationType || 'GENERAL').replaceAll('_', ' ')}
                  </Typography.Text>
                  <Typography.Text
                    className={notif.read ? '' : 'font-medium'}
                    ellipsis={{ rows: 2 }}
                  >
                    {notif.message}
                  </Typography.Text>
                  <Typography.Text type="secondary" className="text-xs block mt-0.5">
                    {timeAgo(notif.sentDate)}
                  </Typography.Text>
                </div>
                {!notif.read && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={(e) => handleMarkAsRead(e, notif)}
                    className="flex-shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className="text-center py-2 mt-2 border-t cursor-pointer hover:bg-gray-50 rounded transition-colors"
        onClick={() => {
          setPopoverOpen(false);
          navigate('/dashboard/notifications');
        }}
      >
        <Typography.Link>View All Notifications</Typography.Link>
      </div>
    </div>
  );

  return (
    <AntLayout className="min-h-screen">
      <Sider
        width={260}
        className="!bg-white border-r border-gray-200 shadow-sm"
        theme="light"
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <CarOutlined className="text-xl text-[#1677ff] mr-2" />
          <Typography.Title level={5} className="!mb-0">
            Vehicle Rental
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          className="border-0 mt-4 px-2"
          style={{ fontSize: 14 }}
        />
      </Sider>

      <AntLayout>
        <Header className="flex items-center justify-end gap-4 px-6 bg-white border-b border-gray-200 shadow-sm h-16">
          <Typography.Text className="text-gray-600">
            {user?.username}
          </Typography.Text>
          <Avatar icon={<UserOutlined />} className="bg-[#1677ff]" size="small" />

          <Popover
            content={notificationContent}
            trigger="click"
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            placement="bottomRight"
          >
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined className="text-lg" />}
                onClick={handleBellClick}
                className="flex items-center justify-center"
              />
            </Badge>
          </Popover>

          <Button
            type="text"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Header>

        <Content className="bg-gray-50 p-6 overflow-auto">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
