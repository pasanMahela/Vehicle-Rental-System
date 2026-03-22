import { useEffect, useState } from 'react';
import { Table, Button, Tag, App, Space, Input, Card, Row, Col, Statistic, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ReloadOutlined,
  DollarOutlined,
  RollbackOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getAllPayments, getPaymentsByCustomer, refundPayment } from '../../api/paymentApi';
import { getAllBookings, getBookingsByCustomer } from '../../api/bookingApi';

const { Title, Text } = Typography;

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

  const isStaff = hasRole('BOOKING_CASHIER', 'OWNER');
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Staff sees all payments, customers see only their own
      const paymentsPromise = isStaff 
        ? getAllPayments()
        : user?.userId
          ? getPaymentsByCustomer(user.userId)
          : Promise.resolve({ data: [] });
      const bookingsPromise = isStaff
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

  // Calculate stats
  const successPayments = payments.filter(p => p.paymentStatus === 'SUCCESS');
  const pendingPayments = payments.filter(p => p.paymentStatus === 'PENDING');
  const failedPayments = payments.filter(p => p.paymentStatus === 'FAILED');
  const totalRevenue = successPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const columns = [
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      render: (id) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
          {id ? id.slice(-12).toUpperCase() : '-'}
        </span>
      ),
      sorter: (a, b) =>
        (a.paymentId || '').localeCompare(b.paymentId || ''),
    },
    {
      title: 'Booking',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (id) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
          {id ? id.slice(-8).toUpperCase() : '-'}
        </span>
      ),
      sorter: (a, b) =>
        (a.bookingId || '').localeCompare(b.bookingId || ''),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt) =>
        amt != null ? (
          <span style={{ fontWeight: 600, color: '#059669' }}>
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
        <Tag color={TYPE_COLORS[type] || 'default'} style={{ borderRadius: 12 }}>
          {type ? type.replace('_', ' ') : '-'}
        </Tag>
      ),
      filters: Object.keys(TYPE_COLORS).map((t) => ({ text: t.replace('_', ' '), value: t })),
      onFilter: (value, record) => record.paymentType === value,
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const icons = {
          SUCCESS: <CheckCircleOutlined />,
          PENDING: <ClockCircleOutlined />,
          FAILED: <CloseCircleOutlined />,
        };
        return (
          <Tag 
            color={STATUS_COLORS[status] || 'default'} 
            icon={icons[status]}
            style={{ borderRadius: 12 }}
          >
            {status || '-'}
          </Tag>
        );
      },
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
        
        // Business Logic:
        // Show "Pay Remaining" button ONLY when ALL conditions are true:
        // 1. This is an ADVANCE_DEPOSIT type payment (not RENTAL_BALANCE)
        // 2. The payment was successful
        // 3. No other payment with type RENTAL_BALANCE or stage FINAL exists for this booking
        // 4. Booking has remaining balance > 0 or finalPaymentDone is false
        
        const isAdvanceDeposit = record.paymentType === 'ADVANCE_DEPOSIT';
        const isSuccessful = record.paymentStatus === 'SUCCESS';
        
        // Count all successful payments for this booking
        const bookingPayments = payments.filter(p => p.bookingId === record.bookingId && p.paymentStatus === 'SUCCESS');
        const finalPaymentCount = bookingPayments.filter(
          p => p.paymentType === 'RENTAL_BALANCE' || p.stage === 'FINAL' || p.paymentType !== 'ADVANCE_DEPOSIT'
        ).length;
        
        // If there's more than 1 successful payment OR any non-advance payment, don't show button
        const showPayRemaining = isAdvanceDeposit && isSuccessful && finalPaymentCount === 0 && bookingPayments.length === 1;

        return (
          <Space>
            {canRefund &&
              record.paymentStatus === 'SUCCESS' && (
                <Button
                  type="text"
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
                style={{ borderRadius: 6 }}
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
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Payment History</Title>
        <Text type="secondary">Track and manage all payment transactions</Text>
      </div>

      {/* Stats Cards - Only visible to staff */}
      {isStaff && (
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CreditCardOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>Total Revenue</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                  LKR {totalRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>Successful</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                  {successPayments.length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClockCircleOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>Pending</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                  {pendingPayments.length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CloseCircleOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>Failed</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                  {failedPayments.length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      )}

      {/* Table Card */}
      <Card 
        style={{ 
          borderRadius: 16, 
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Search Bar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Input
            placeholder="Search by Payment or Booking ID"
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 300, borderRadius: 8 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            Refresh
          </Button>
        </div>

        {/* Table */}
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
          style={{ borderRadius: 0 }}
        />
      </Card>
    </div>
  );
}
