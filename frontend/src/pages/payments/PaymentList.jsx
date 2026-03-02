import { useEffect, useState } from 'react';
import { Table, Button, Tag, App, Space, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ReloadOutlined,
  DollarOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getAllPayments, refundPayment } from '../../api/paymentApi';
import { getAllBookings, getBookingsByCustomer } from '../../api/bookingApi';

const TYPE_COLORS = {
  ADVANCE_DEPOSIT: 'blue',
  RENTAL_BALANCE: 'green',
  DAMAGE: 'orange',
  REFUND: 'purple',
};

const STATUS_COLORS = {
  SUCCESS: 'green',
  FAILED: 'red',
  REFUNDED: 'orange',
  PENDING: 'gold',
};

export default function PaymentList() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const paymentsPromise = getAllPayments();
      const bookingsPromise = hasRole('BOOKING_CASHIER', 'OWNER')
        ? getAllBookings()
        : user?.userId
          ? getBookingsByCustomer(user.userId)
          : Promise.resolve({ data: [] });
      const [paymentsRes, bookingsRes] = await Promise.all([
        paymentsPromise,
        bookingsPromise,
      ]);
      setPayments(paymentsRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch {
      message.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefund = async (id) => {
    try {
      await refundPayment(id);
      message.success('Payment refunded successfully');
      loadData();
    } catch {
      message.error('Failed to refund payment');
    }
  };

  const canRefund = hasRole('BOOKING_CASHIER', 'OWNER');
  const bookingMap = Object.fromEntries(
    (bookings || []).map((b) => [b.bookingId, b])
  );

  const filteredPayments = searchText
    ? payments.filter(
        (p) =>
          (p.paymentId && p.paymentId.toLowerCase().includes(searchText.toLowerCase())) ||
          (p.bookingId && p.bookingId.toLowerCase().includes(searchText.toLowerCase()))
      )
    : payments;

  const columns = [
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      render: (id) => (
        <span className="font-mono text-xs">
          {id ? id.slice(-12) : '-'}
        </span>
      ),
      sorter: (a, b) =>
        (a.paymentId || '').localeCompare(b.paymentId || ''),
    },
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (id) => (
        <span className="font-mono text-xs">
          {id ? id.slice(-12) : '-'}
        </span>
      ),
      sorter: (a, b) =>
        (a.bookingId || '').localeCompare(b.bookingId || ''),
    },
    {
      title: 'Amount (LKR)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt) =>
        amt != null ? (
          <span className="font-medium">
            LKR {Number(amt).toLocaleString()}
          </span>
        ) : (
          '-'
        ),
      sorter: (a, b) => (a.amount ?? 0) - (b.amount ?? 0),
    },
    {
      title: 'Type',
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (type) => (
        <Tag color={TYPE_COLORS[type] || 'default'}>
          {type || '-'}
        </Tag>
      ),
      filters: Object.keys(TYPE_COLORS).map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.paymentType === value,
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage) => stage || '-',
      filters: [
        { text: 'ADVANCE', value: 'ADVANCE' },
        { text: 'FINAL', value: 'FINAL' },
      ],
      onFilter: (value, record) => record.stage === value,
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status || '-'}
        </Tag>
      ),
      filters: Object.keys(STATUS_COLORS).map((s) => ({
        text: s,
        value: s,
      })),
      onFilter: (value, record) => record.paymentStatus === value,
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
      sorter: (a, b) =>
        new Date(a.paymentDate || 0) - new Date(b.paymentDate || 0),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const booking = bookingMap[record.bookingId];
        const showPayRemaining =
          booking &&
          booking.finalPaymentDone === false &&
          (booking.remainingBalance ?? 0) > 0;

        return (
          <Space>
            {canRefund &&
              record.paymentStatus === 'SUCCESS' && (
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={() => handleRefund(record.paymentId)}
                >
                  Refund
                </Button>
              )}
            {showPayRemaining && (
              <Button
                type="primary"
                size="small"
                icon={<DollarOutlined />}
                onClick={() =>
                  navigate(`/dashboard/payments/pay/${record.bookingId}`)
                }
              >
                Pay Remaining
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 text-xl font-semibold">Payment History</h2>
        <Space>
          <Input
            placeholder="Search by Payment or Booking ID"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPayments}
        rowKey="paymentId"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} payments`,
        }}
        size="middle"
      />
    </div>
  );
}
