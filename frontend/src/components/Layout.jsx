import { useEffect, useState, useCallback } from 'react';
import { Layout as AntLayout, Menu, Avatar, Badge, Popover, Button, Typography, App, Dropdown, Space } from 'antd';
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
  DownOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notificationApi';

const { Header, Content } = AntLayout;

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/dashboard/profile'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      onClick: () => navigate('/dashboard/notifications'),
    },
    ...(hasRole('OWNER') ? [
      {
        key: 'users',
        icon: <TeamOutlined />,
        label: 'Manage Users',
        onClick: () => navigate('/dashboard/users'),
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        onClick: () => navigate('/dashboard/settings'),
      },
    ] : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const notificationContent = (
    <div style={{ width: 380, borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BellOutlined style={{ color: '#ffffff', fontSize: 18 }} />
          <span style={{ color: '#ffffff', fontSize: 16, fontWeight: 600 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ 
              backgroundColor: '#ef4444', 
              color: '#ffffff', 
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 600
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={handleMarkAllRead}
            style={{ color: 'rgba(255,255,255,0.9)', padding: 0, height: 'auto', fontSize: 12 }}
          >
            Mark all read
          </Button>
        )}
      </div>
      
      {/* Notifications List */}
      <div style={{ maxHeight: 400, overflowY: 'auto', backgroundColor: '#ffffff' }}>
        {loadingNotifs && notifications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              backgroundColor: '#f3f4f6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <BellOutlined style={{ fontSize: 24, color: '#9ca3af' }} />
            </div>
            <span style={{ color: '#6b7280' }}>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              backgroundColor: '#f3f4f6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <BellOutlined style={{ fontSize: 28, color: '#9ca3af' }} />
            </div>
            <span style={{ color: '#374151', fontWeight: 500, display: 'block', marginBottom: 4 }}>
              No notifications yet
            </span>
            <span style={{ color: '#9ca3af', fontSize: 13 }}>
              We'll notify you when something arrives
            </span>
          </div>
        ) : (
          <div>
            {notifications.map((notif, index) => (
              <div
                key={notif.notificationId}
                style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: notif.read ? '#ffffff' : '#eff6ff',
                  borderBottom: index < notifications.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
                onClick={() => handleClickNotification(notif)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = notif.read ? '#f9fafb' : '#dbeafe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notif.read ? '#ffffff' : '#eff6ff';
                }}
              >
                {/* Status Indicator */}
                <div style={{ paddingTop: 6, width: 8 }}>
                  {!notif.read && (
                    <span style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: '#3b82f6',
                      display: 'block',
                      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
                    }} />
                  )}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 4 
                  }}>
                    <span style={{ 
                      fontSize: 10, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      color: '#6b7280',
                      fontWeight: 600
                    }}>
                      {(notif.notificationType || 'GENERAL').replaceAll('_', ' ')}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>•</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {timeAgo(notif.sentDate)}
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: notif.read ? '#6b7280' : '#1f2937',
                    fontWeight: notif.read ? 400 : 500
                  }}>
                    {notif.message}
                  </p>
                </div>
                
                {/* Mark as Read Button */}
                {!notif.read && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined style={{ fontSize: 12 }} />}
                    onClick={(e) => handleMarkAsRead(e, notif)}
                    style={{ 
                      opacity: 0.5,
                      padding: '4px 8px',
                      height: 'auto',
                      borderRadius: 6
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div
        style={{ 
          padding: '12px 20px',
          textAlign: 'center',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#fafafa',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onClick={() => {
          setPopoverOpen(false);
          navigate('/dashboard/notifications');
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
      >
        <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: 13 }}>
          View All Notifications →
        </span>
      </div>
    </div>
  );

  return (
    <AntLayout className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <Header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-8 h-16"
        style={{ 
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        {/* Logo Section */}
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity no-underline">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <CarOutlined style={{ fontSize: 20, color: '#ffffff' }} />
          </div>
          <span className="text-lg font-bold text-white hidden sm:block" style={{ color: '#ffffff' }}>
            Orchid Rentals
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.key}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium no-underline"
              style={{ 
                backgroundColor: location.pathname === item.key ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.key) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ color: '#ffffff' }}>{item.icon}</span>
              <span style={{ color: '#ffffff' }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Popover
            content={notificationContent}
            trigger="click"
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            placement="bottomRight"
            arrow={false}
            overlayInnerStyle={{ 
              padding: 0, 
              borderRadius: 16, 
              boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <Badge count={unreadCount} size="small" offset={[-4, 4]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18, color: '#ffffff' }} />}
                onClick={handleBellClick}
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              />
            </Badge>
          </Popover>

          {/* User Dropdown */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <Button 
              type="text" 
              className="flex items-center gap-2 h-10 px-3 rounded-lg border-0"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Avatar 
                icon={<UserOutlined />} 
                size="small"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
              <span className="font-medium hidden md:inline" style={{ color: '#ffffff' }}>{user?.username}</span>
              <DownOutlined className="text-xs hidden md:inline" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </Button>
          </Dropdown>

          {/* Mobile Menu Button */}
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 18, color: '#ffffff' }} />}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>
      </Header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b shadow-lg">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.key}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  location.pathname === item.key
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <Content className="pt-16 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </Content>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CarOutlined />
              <span className="font-medium">Orchid Vehicle Rental</span>
            </div>
            <Typography.Text type="secondary" className="text-sm">
              © {new Date().getFullYear()} Orchid Rentals. All rights reserved.
            </Typography.Text>
          </div>
        </div>
      </footer>
    </AntLayout>
  );
}
