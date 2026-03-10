import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Popconfirm,
  App,
  Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import {
  getAllVehicles,
  deleteVehicle,
  updateVehicleStatus,
  getDistinctBrands,
  getDistinctTypes,
  getRankedVehicles,
} from '../../api/vehicleApi';
import VehicleForm from './VehicleForm';

const STATUS_COLORS = {
  AVAILABLE: 'success',
  BOOKED: 'processing',
  MAINTENANCE: 'warning',
};

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

export default function VehicleList() {
  const { hasRole } = useAuth();
  const { message } = App.useApp();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [filters, setFilters] = useState({
    brand: undefined,
    type: undefined,
    status: undefined,
    search: '',
  });
  const [rankedView, setRankedView] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, brandsRes, typesRes] = await Promise.all([
        rankedView ? getRankedVehicles() : getAllVehicles(),
        getDistinctBrands(),
        getDistinctTypes(),
      ]);
      setVehicles(vehiclesRes.data || []);
      setBrands(brandsRes.data || []);
      setTypes(typesRes.data || []);
    } catch {
      message.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [rankedView]);

  const handleDelete = async (id) => {
    try {
      await deleteVehicle(id);
      message.success('Vehicle deleted');
      load();
    } catch {
      message.error('Failed to delete vehicle');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateVehicleStatus(id, status);
      message.success('Status updated');
      load();
    } catch {
      message.error('Failed to update status');
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchBrand = !filters.brand || v.brand === filters.brand;
      const matchType = !filters.type || v.type === filters.type;
      const matchStatus = !filters.status || v.availabilityStatus === filters.status;
      const searchLower = (filters.search || '').toLowerCase();
      const matchSearch =
        !searchLower ||
        (v.brand || '').toLowerCase().includes(searchLower) ||
        (v.model || '').toLowerCase().includes(searchLower);
      return matchBrand && matchType && matchStatus && matchSearch;
    });
  }, [vehicles, filters]);

  const rankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const rankedColumns = rankedView
    ? [
        {
          title: 'Rank',
          dataIndex: 'popularityRank',
          key: 'popularityRank',
          width: 80,
          render: (rank) => (
            <span style={{ fontSize: rank <= 3 ? 20 : 14, fontWeight: 'bold' }}>
              {rankMedal(rank)}
            </span>
          ),
          sorter: (a, b) => (a.popularityRank ?? 0) - (b.popularityRank ?? 0),
        },
        {
          title: 'Bookings',
          dataIndex: 'bookingCount',
          key: 'bookingCount',
          width: 100,
          render: (val) => (
            <Tag color={val > 0 ? 'blue' : 'default'}>{val ?? 0}</Tag>
          ),
          sorter: (a, b) => (a.bookingCount ?? 0) - (b.bookingCount ?? 0),
        },
      ]
    : [];

  const columns = [
    ...rankedColumns,
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      sorter: (a, b) => (a.brand || '').localeCompare(b.brand || ''),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      sorter: (a, b) => (a.model || '').localeCompare(b.model || ''),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => (a.type || '').localeCompare(b.type || ''),
    },
    {
      title: 'Price/Day (LKR)',
      dataIndex: 'pricePerDay',
      key: 'pricePerDay',
      render: (val) => (val != null ? val.toLocaleString('en-LK') : '-'),
      sorter: (a, b) => (a.pricePerDay ?? 0) - (b.pricePerDay ?? 0),
    },
    {
      title: 'Advance Deposit (LKR)',
      dataIndex: 'advanceDeposit',
      key: 'advanceDeposit',
      render: (val) => (val != null ? val.toLocaleString('en-LK') : '-'),
      sorter: (a, b) => (a.advanceDeposit ?? 0) - (b.advanceDeposit ?? 0),
    },
    {
      title: 'Status',
      dataIndex: 'availabilityStatus',
      key: 'availabilityStatus',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{status || '-'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {hasRole('OWNER') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(record);
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
          )}
          {hasRole('OWNER') && (
            <Popconfirm
              title="Delete vehicle"
              description="Are you sure you want to delete this vehicle?"
              onConfirm={() => handleDelete(record.vehicleId)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
          {(hasRole('REPAIR_ADVISOR') || hasRole('OWNER')) && (
            <Select
              size="small"
              value={record.availabilityStatus}
              options={STATUS_OPTIONS}
              onChange={(val) => handleStatusChange(record.vehicleId, val)}
              style={{ width: 120 }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold m-0">Vehicles</h2>
        <Space>
          <Button
            type={rankedView ? 'primary' : 'default'}
            icon={<TrophyOutlined />}
            onClick={() => setRankedView((v) => !v)}
          >
            {rankedView ? 'Ranked View' : 'Show Rankings'}
          </Button>
          {hasRole('OWNER') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add Vehicle
            </Button>
          )}
        </Space>
      </div>

      <Card className="shadow-sm">
        <Space direction="vertical" size="middle" className="w-full mb-4">
          <Input.Search
            placeholder="Search by brand or model..."
            allowClear
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            onSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
            style={{ maxWidth: 280 }}
          />
          <Space wrap>
            <Select
              placeholder="Filter by Brand"
              allowClear
              value={filters.brand}
              onChange={(v) => setFilters((f) => ({ ...f, brand: v }))}
              options={brands.map((b) => {
                const val = typeof b === 'string' ? b : b?.value ?? b?.label ?? b;
                return { value: val, label: val };
              })}
              style={{ width: 160 }}
            />
            <Select
              placeholder="Filter by Type"
              allowClear
              value={filters.type}
              onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
              options={types.map((t) => {
                const val = typeof t === 'string' ? t : t?.value ?? t?.label ?? t;
                return { value: val, label: val };
              })}
              style={{ width: 160 }}
            />
            <Select
              placeholder="Filter by Status"
              allowClear
              value={filters.status}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              options={STATUS_OPTIONS}
              style={{ width: 160 }}
            />
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredVehicles}
          rowKey="vehicleId"
          loading={loading}
          rowClassName={() => 'hover:bg-blue-50/50 transition-colors'}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} vehicles`,
          }}
        />
      </Card>

      <VehicleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        vehicle={editing}
      />
    </div>
  );
}
