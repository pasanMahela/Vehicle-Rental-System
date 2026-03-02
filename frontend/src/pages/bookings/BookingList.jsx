import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Spin, Popconfirm, Select, App, Typography } from 'antd';
import { PlusOutlined, CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getAllBookings, cancelBooking, completeBooking } from '../../api/bookingApi';
import { getAllVehicles } from '../../api/vehicleApi';
import BookingForm from './BookingForm';

const { Title } = Typography;

const STATUS_COLORS = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

export default function BookingList() {
  const { user, hasRole } = useAuth();
  const { message } = App.useApp();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bookRes, vehRes] = await Promise.all([getAllBookings(), getAllVehicles()]);
      setBookings(bookRes.data);
      setVehicles(vehRes.data);
    } catch {
      message.error('Failed to load bookings');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const vehicleMap = {};
  vehicles.forEach(v => { vehicleMap[v.vehicleId] = `${v.brand} ${v.model}`; });

  const handleCancel = async (id) => {
    try {
      await cancelBooking(id);
      message.success('Booking cancelled');
      load();
    } catch {
      message.error('Failed to cancel');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeBooking(id);
      message.success('Booking completed');
      load();
    } catch {
      message.error('Failed to complete');
    }
  };

  const canCreate = hasRole('CUSTOMER', 'BOOKING_CASHIER', 'OWNER');
  const canManage = hasRole('BOOKING_CASHIER', 'OWNER');

  const filteredBookings = statusFilter
    ? bookings.filter(b => b.status === statusFilter)
    : bookings;

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (id) => <span className="font-mono text-xs">{id?.slice(-8)}</span>,
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleId',
      key: 'vehicle',
      render: (id) => vehicleMap[id] || id?.slice(-8),
    },
    {
      title: 'Customer',
      dataIndex: 'customerEmail',
      key: 'customer',
      ellipsis: true,
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, r) => `${r.startDate} → ${r.endDate}`,
    },
    {
      title: 'Total (LKR)',
      dataIndex: 'totalAmount',
      key: 'total',
      render: (v) => `LKR ${v?.toLocaleString()}`,
    },
    {
      title: 'Advance (LKR)',
      dataIndex: 'advancePaid',
      key: 'advance',
      render: (v) => `LKR ${v?.toLocaleString()}`,
    },
    {
      title: 'Remaining (LKR)',
      dataIndex: 'remainingBalance',
      key: 'remaining',
      render: (v) => `LKR ${v?.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          {(canManage || (hasRole('CUSTOMER') && r.customerId === user.userId)) &&
            r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
            <Popconfirm title="Cancel this booking?" onConfirm={() => handleCancel(r.bookingId)}>
              <Button type="text" danger icon={<CloseCircleOutlined />} size="small">Cancel</Button>
            </Popconfirm>
          )}
          {canManage && r.status === 'CONFIRMED' && (
            <Button type="text" icon={<CheckCircleOutlined />} size="small"
                    onClick={() => handleComplete(r.bookingId)}
                    style={{ color: '#52c41a' }}>
              Complete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">Bookings</Title>
        <Space>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
              New Booking
            </Button>
          )}
        </Space>
      </div>

      <Table
        dataSource={filteredBookings}
        columns={columns}
        rowKey="bookingId"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 10 }}
      />

      <BookingForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </div>
  );
}
