import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  App,
  Card,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  WarningOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import {
  getAllMaintenance,
  deleteMaintenance,
  completeMaintenance,
} from '../../api/maintenanceApi';
import MaintenanceForm from './MaintenanceForm';
import DamageForm from './DamageForm';

const STATUS_COLORS = {
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
};

export default function MaintenanceList() {
  const { hasRole } = useAuth();
  const { message } = App.useApp();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [damageOpen, setDamageOpen] = useState(false);
  const [damageContext, setDamageContext] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllMaintenance();
      setRecords(res.data || []);
    } catch {
      message.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleComplete = async (id) => {
    try {
      await completeMaintenance(id);
      message.success('Maintenance marked as completed');
      load();
    } catch {
      message.error('Failed to complete maintenance');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaintenance(id);
      message.success('Maintenance record deleted');
      load();
    } catch {
      message.error('Failed to delete maintenance');
    }
  };

  const openDamageModal = (record) => {
    setDamageContext({
      inspectionId: record.maintenanceId ?? record.id,
      vehicleId: record.vehicleId,
      bookingId: record.bookingId,
    });
    setDamageOpen(true);
  };

  const columns = [
    {
      title: 'Maintenance ID',
      dataIndex: 'maintenanceId',
      key: 'maintenanceId',
      render: (val, r) => val ?? r.id ?? '-',
    },
    {
      title: 'Vehicle ID',
      dataIndex: 'vehicleId',
      key: 'vehicleId',
    },
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (val) => val ?? '-',
    },
    {
      title: 'Inspection Date',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (val) =>
        val ? new Date(val).toLocaleDateString('en-LK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (val) => val ?? '-',
    },
    {
      title: 'Has Damage',
      key: 'hasDamage',
      render: (_, record) => (
        <Tag color={record.hasDamage ? 'red' : 'default'}>
          {record.hasDamage ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status ?? 'IN_PROGRESS'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'COMPLETED' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record.maintenanceId ?? record.id)}
            >
              Complete
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<WarningOutlined />}
            onClick={() => openDamageModal(record)}
          >
            Record Damage
          </Button>
          <Popconfirm
            title="Delete maintenance record"
            description="Are you sure you want to delete this record?"
            onConfirm={() => handleDelete(record.maintenanceId ?? record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold m-0">Maintenance Management</h2>
        {(hasRole('REPAIR_ADVISOR') || hasRole('OWNER')) && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Maintenance
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={records}
          rowKey={(r) => r.maintenanceId ?? r.id}
          loading={loading}
          rowClassName={() => 'hover:bg-blue-50/50 transition-colors'}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
          }}
        />
      </Card>

      <MaintenanceForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setFormOpen(false);
          setEditing(null);
          load();
        }}
        record={editing}
      />

      <DamageForm
        open={damageOpen}
        onClose={() => {
          setDamageOpen(false);
          setDamageContext(null);
        }}
        onSaved={() => {
          setDamageOpen(false);
          setDamageContext(null);
          load();
        }}
        inspectionId={damageContext?.inspectionId}
        vehicleId={damageContext?.vehicleId}
        bookingId={damageContext?.bookingId}
      />
    </div>
  );
}
