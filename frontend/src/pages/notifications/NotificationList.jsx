import { useEffect, useState } from 'react';
import {
  Button,
  List,
  Card,
  Badge,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  App,
} from 'antd';
import {
  SendOutlined,
  CheckOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
} from '../../api/notificationApi';
function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown time';
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

const ROLES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'BOOKING_CASHIER', label: 'Booking Cashier' },
  { value: 'REPAIR_ADVISOR', label: 'Repair Advisor' },
  { value: 'OWNER', label: 'Owner' },
];

export default function NotificationList() {
  const { user, hasRole } = useAuth();
  const { message } = App.useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendForm] = Form.useForm();

  const load = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const res = await getUserNotifications(user.userId);
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.userId]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      message.success('Marked as read');
      load();
    } catch {
      message.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.userId) return;
    try {
      await markAllAsRead(user.userId);
      message.success('All marked as read');
      load();
    } catch {
      message.error('Failed to mark all as read');
    }
  };

  const handleSendNotification = async () => {
    try {
      const values = await sendForm.validateFields();
      await sendNotification({
        type: values.type || 'INFO',
        message: values.message,
        recipientRole: values.recipientRole,
        recipientUserId: values.recipientUserId || undefined,
      });
      message.success('Notification sent');
      setSendModalOpen(false);
      sendForm.resetFields();
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Failed to send notification');
    }
  };

  const canSend = hasRole('BOOKING_CASHIER', 'OWNER');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Space>
          <h2 className="text-xl font-semibold m-0">Notifications</h2>
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small">
              <BellOutlined className="text-lg text-gray-500" />
            </Badge>
          )}
        </Space>
        <Space>
          {unreadCount > 0 && (
            <Button
              icon={<CheckOutlined />}
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
          {canSend && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => setSendModalOpen(true)}
            >
              Send Notification
            </Button>
          )}
        </Space>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <List
          loading={loading}
          dataSource={notifications}
          locale={{ emptyText: 'No notifications yet' }}
          renderItem={(item) => (
            <List.Item
              key={item.notificationId ?? item.id}
              className={`p-4 border-b last:border-b-0 transition-colors hover:bg-slate-50 ${
                !item.read ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="flex items-start w-full gap-4">
                <div className="flex-shrink-0 mt-1">
                  {!item.read && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Space size="small" className="mb-1">
                    <Tag color="blue">{item.type ?? 'INFO'}</Tag>
                    {!item.read && (
                      <Tag color="processing">Unread</Tag>
                    )}
                  </Space>
                  <p className="m-0 text-gray-800">{item.message}</p>
                  <p className="m-0 mt-1 text-sm text-gray-500">
                    {timeAgo(item.createdAt ?? item.sentDate)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {!item.read && (
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleMarkAsRead(item.notificationId ?? item.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Send Notification"
        open={sendModalOpen}
        onCancel={() => {
          setSendModalOpen(false);
          sendForm.resetFields();
        }}
        onOk={handleSendNotification}
        okText="Send"
        destroyOnClose
      >
        <Form form={sendForm} layout="vertical" className="mt-4">
          <Form.Item
            name="type"
            label="Type"
            initialValue="INFO"
          >
            <Select
              options={[
                { value: 'INFO', label: 'Info' },
                { value: 'WARNING', label: 'Warning' },
                { value: 'ALERT', label: 'Alert' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Message is required' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter notification message" />
          </Form.Item>
          <Form.Item name="recipientRole" label="Recipient Role">
            <Select placeholder="All users with role" allowClear options={ROLES} />
          </Form.Item>
          <Form.Item name="recipientUserId" label="Recipient User ID (optional)">
            <Input placeholder="Specific user ID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
