import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Popconfirm, Select, App, Typography, Tooltip } from 'antd';
import { PlusOutlined, CloseCircleOutlined, CheckCircleOutlined, CalendarOutlined, FilterOutlined, CarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getAllBookings, cancelBooking, completeBooking } from '../../api/bookingApi';
import { getAllVehicles } from '../../api/vehicleApi';
import BookingForm from './BookingForm';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  PENDING: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  CONFIRMED: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  COMPLETED: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
};

export default function BookingList() {
  const navigate = useNavigate();
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
      message.success('Booking cancelled successfully');
      load();
    } catch {
      message.error('Failed to cancel booking');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeBooking(id);
      message.success('Booking completed successfully');
      load();
    } catch {
      message.error('Failed to complete booking');
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
      width: 120,
      render: (_, __, index) => (
        <span className="font-mono font-semibold text-indigo-600">
          BOOK{(index + 1).toString().padStart(3, '0')}
        </span>
      ),
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleId',
      key: 'vehicle',
      width: 180,
      render: (id) => (
        <div className="flex items-center gap-2">
          <CarOutlined className="text-gray-400" />
          <span className="text-gray-700">{id} - {vehicleMap[id] || 'Unknown Vehicle'}</span>
        </div>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      width: 220,
      render: (_, r) => (
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarOutlined className="text-gray-400" />
          <span className="text-sm">{r.startDate}</span>
          <span className="text-gray-400">→</span>
          <span className="text-sm">{r.endDate}</span>
        </div>
      ),
    },
    {
      title: 'Total (LKR)',
      dataIndex: 'totalAmount',
      key: 'total',
      align: 'right',
      width: 120,
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: (v) => (
        <span className="font-medium text-gray-800">{v?.toLocaleString()}</span>
      ),
    },
    {
      title: 'Advance (LKR)',
      dataIndex: 'advancePaid',
      key: 'advance',
      align: 'right',
      width: 120,
      sorter: (a, b) => (a.advancePaid || 0) - (b.advancePaid || 0),
      render: (v) => (
        <span className="text-amber-600 font-medium">{v?.toLocaleString()}</span>
      ),
    },
    {
      title: 'Remaining (LKR)',
      dataIndex: 'remainingBalance',
      key: 'remaining',
      align: 'right',
      width: 130,
      sorter: (a, b) => (a.remainingBalance || 0) - (b.remainingBalance || 0),
      render: (v) => (
        <span className="text-emerald-600 font-bold">{v?.toLocaleString()}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
      render: (s) => (
        <Tag 
          style={{ 
            backgroundColor: STATUS_COLORS[s]?.bg, 
            color: STATUS_COLORS[s]?.text,
            borderColor: STATUS_COLORS[s]?.border,
            borderRadius: '6px',
            padding: '4px 10px',
            fontWeight: 500,
            fontSize: '12px',
            margin: 0,
            border: '1px solid'
          }}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, r) => (
        <Space size="small">
          {(canManage || (hasRole('CUSTOMER') && r.customerId === user.userId)) &&
            r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
            <Popconfirm 
              title="Cancel Booking" 
              description="Are you sure you want to cancel this booking?" 
              onConfirm={() => handleCancel(r.bookingId)} 
              okText="Yes" 
              cancelText="No"
              placement="left"
            >
              <Tooltip title="Cancel Booking">
                <Button 
                  danger 
                  type="text" 
                  icon={<CloseCircleOutlined />} 
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          )}
          {canManage && r.status === 'CONFIRMED' && (
            <Tooltip title="Mark as Completed">
              <Button 
                type="text" 
                icon={<CheckCircleOutlined />} 
                size="small"
                onClick={() => handleComplete(r.bookingId)}
                style={{ color: '#059669' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
            <div className="relative p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <CalendarOutlined className="text-white text-xl" />
                  </div>
                  <div>
                    <Title level={3} className="!m-0 text-gray-800">
                      My Bookings
                    </Title>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      <Text type="secondary" className="text-sm">
                        View and manage your vehicle reservations
                      </Text>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-gray-50 rounded-lg px-4 py-2">
                    <Text className="text-xs text-gray-500">Total</Text>
                    <Text className="text-lg font-semibold text-gray-800 block">{bookings.length}</Text>
                  </div>
                  <div className="bg-indigo-50 rounded-lg px-4 py-2">
                    <Text className="text-xs text-indigo-500">Active</Text>
                    <Text className="text-lg font-semibold text-indigo-600 block">
                      {bookings.filter(b => b.status === 'CONFIRMED').length}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Select
            placeholder="Filter by status"
            allowClear
            size="middle"
            className="w-full sm:w-48"
            value={statusFilter}
            onChange={setStatusFilter}
            suffixIcon={<FilterOutlined />}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          {canCreate && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/dashboard/vehicles/book')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              New Booking
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table
            dataSource={filteredBookings}
            columns={columns}
            rowKey="bookingId"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} bookings`,
              className: 'px-4 py-3'
            }}
          />
        </div>
      </div>

      <BookingForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </div>
  );
}