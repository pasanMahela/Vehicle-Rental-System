import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  App,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Modal,
  InputNumber,
  Tabs,
  Typography,
  Badge,
  Avatar,
  Statistic,
  Divider,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  WarningOutlined,
  CarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  BarChartOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import {
  getAllMaintenance,
  deleteMaintenance,
  completeMaintenance,
  startMaintenance,
  getAllIssues,
  getIssueById,
  scheduleMaintenanceFromIssue,
} from '../../api/maintenanceApi';
import MaintenanceForm from './MaintenanceForm';
import DamageForm from './DamageForm';

const STATUS_COLORS = {
  SCHEDULED: { color: '#1890ff', bg: '#e6f7ff', icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { color: '#fa8c16', bg: '#fff7e6', icon: <SyncOutlined spin /> },
  COMPLETED: { color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleOutlined /> },
  CANCELLED: { color: '#f5222d', bg: '#fff1f0', icon: <ExclamationCircleOutlined /> },
};

const MAINTENANCE_TYPES = [
  { value: 'SCHEDULED', label: 'Scheduled', color: '#1890ff' },
  { value: 'REPAIR', label: 'Repair', color: '#fa8c16' },
  { value: 'ACCIDENT', label: 'Accident', color: '#f5222d' },
  { value: 'BREAKDOWN', label: 'Breakdown', color: '#722ed1' },
];

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const RECURRENCE_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const ISSUE_STATUS_COLORS = {
  REPORTED: { color: '#faad14', bg: '#fffbe6', icon: <ExclamationCircleOutlined /> },
  SCHEDULED: { color: '#1890ff', bg: '#e6f7ff', icon: <CalendarOutlined /> },
  RESOLVED: { color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleOutlined /> },
};

const { Title, Text, Paragraph } = Typography;

const getIssueKey = (issue) =>
  issue?.id ||
  issue?._id ||
  `${issue?.vehicleId || 'unknown'}-${issue?.reportedDate || 'no-date'}-${issue?.description || 'no-desc'}`;

export default function MaintenanceList() {
  const { hasRole } = useAuth();
  const { message } = App.useApp();
  const [maintenanceFilterForm] = Form.useForm();
  const [issueFilterForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [damageOpen, setDamageOpen] = useState(false);
  const [damageContext, setDamageContext] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeTab, setActiveTab] = useState('issues');
  const [maintenanceFilters, setMaintenanceFilters] = useState({
    vehicleId: '',
    status: undefined,
    maintenanceType: undefined,
    isRecurring: undefined,
    searchTerm: '',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [issueFilters, setIssueFilters] = useState({
    vehicleId: '',
    status: undefined,
    issueType: undefined,
    searchTerm: '',
    dateFrom: undefined,
    dateTo: undefined,
  });

  const load = async () => {
    setLoading(true);
    setIssuesLoading(true);
    try {
      console.log('[Maintenance] Loading records...');
      const res = await getAllMaintenance();
      console.log('[Maintenance] API Response:', res);
      const allRecords = res.data || [];
      console.log('[Maintenance] Records loaded:', allRecords.length);
      setRecords(allRecords);
      applyFilters(allRecords);

      const allIssuesRes = await getAllIssues();
      const issuesFromAllEndpoint = allIssuesRes.data || [];

      const issueIdsFromRecords = [...new Set(allRecords.map((record) => record.issueId).filter(Boolean))];
      const issueByIdResponses = await Promise.allSettled(
        issueIdsFromRecords.map((issueId) => getIssueById(issueId))
      );
      const issuesFromRecords = issueByIdResponses
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value.data)
        .filter(Boolean);

      const mergedIssues = [...issuesFromAllEndpoint, ...issuesFromRecords];
      const uniqueIssues = Array.from(
        new Map(mergedIssues.map((issue) => [getIssueKey(issue), issue])).values()
      );
      setIssues(uniqueIssues);

      if (allRecords.length === 0) {
        message.info('No maintenance records found');
      }
    } catch (err) {
      console.error('[Maintenance] Load error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.response?.data?.message,
        fullError: err,
      });
      const errorMsg = err.response?.status === 401 
        ? 'Authentication failed. Please log in again.' 
        : err.response?.status === 403 
        ? 'You do not have permission to view maintenance records.' 
        : err.response?.status === 404
        ? 'Maintenance service endpoint not found. Please check backend.'
        : err.response?.data?.message || 'Failed to load maintenance records. Please try again.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
      setIssuesLoading(false);
    }
  };

  const applyFilters = (data) => {
    const filtered = data.filter(record => {
      if (maintenanceFilters.vehicleId && !record.vehicleId?.includes(maintenanceFilters.vehicleId)) {
        return false;
      }
      if (maintenanceFilters.status && record.status !== maintenanceFilters.status) {
        return false;
      }
      if (maintenanceFilters.maintenanceType && record.maintenanceType !== maintenanceFilters.maintenanceType) {
        return false;
      }
      if (maintenanceFilters.isRecurring !== undefined && record.isRecurring !== maintenanceFilters.isRecurring) {
        return false;
      }
      if (maintenanceFilters.searchTerm) {
        const term = maintenanceFilters.searchTerm.toLowerCase();
        const matchesDescription = record.description?.toLowerCase().includes(term);
        const matchesIssue = record.issueId?.toLowerCase().includes(term);
        if (!matchesDescription && !matchesIssue) {
          return false;
        }
      }
      if (maintenanceFilters.dateFrom || maintenanceFilters.dateTo) {
        const recordDate = record.scheduledDate ? new Date(record.scheduledDate) : null;
        if (recordDate) {
          if (maintenanceFilters.dateFrom) {
            const fromDate =
              typeof maintenanceFilters.dateFrom?.toDate === 'function'
                ? maintenanceFilters.dateFrom.toDate()
                : new Date(maintenanceFilters.dateFrom);
            if (recordDate < fromDate) {
              return false;
            }
          }
          if (maintenanceFilters.dateTo) {
            const toDate =
              typeof maintenanceFilters.dateTo?.toDate === 'function'
                ? maintenanceFilters.dateTo.toDate()
                : new Date(maintenanceFilters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (recordDate > toDate) {
              return false;
            }
          }
        }
      }
      return true;
    });
    setFilteredRecords(filtered);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    applyFilters(records);
  }, [maintenanceFilters, records]);

  const handleMaintenanceFilterChange = (changedValues) => {
    setMaintenanceFilters(prev => ({
      ...prev,
      ...changedValues,
    }));
  };

  const handleIssueFilterChange = (changedValues) => {
    setIssueFilters(prev => ({
      ...prev,
      ...changedValues,
    }));
  };

  const handleResetMaintenanceFilters = () => {
    maintenanceFilterForm.resetFields();
    setMaintenanceFilters({
      vehicleId: '',
      status: undefined,
      maintenanceType: undefined,
      isRecurring: undefined,
      searchTerm: '',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handleResetIssueFilters = () => {
    issueFilterForm.resetFields();
    setIssueFilters({
      vehicleId: '',
      status: undefined,
      issueType: undefined,
      searchTerm: '',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handleStart = async (id) => {
    try {
      await startMaintenance(id);
      message.success('Maintenance started');
      load();
    } catch (err) {
      message.error(err.message || 'Failed to start maintenance');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeMaintenance(id, { actualCost: 0 });
      message.success('Maintenance completed');
      load();
    } catch (err) {
      message.error(err.message || 'Failed to complete maintenance');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaintenance(id);
      message.success('Maintenance record deleted');
      load();
    } catch (err) {
      message.error(err.message || 'Failed to delete maintenance');
    }
  };

  const openDamageModal = (record) => {
    setDamageContext({
      vehicleId: record?.vehicleId,
    });
    setDamageOpen(true);
  };

  const openScheduleIssueModal = (issue) => {
    setSelectedIssue(issue);
    scheduleForm.resetFields();
    scheduleForm.setFieldsValue({
      scheduledDate: null,
      estimatedCost: 0,
    });
    setScheduleOpen(true);
  };

  const handleScheduleFromIssue = async () => {
    if (!selectedIssue) return;
    try {
      const values = await scheduleForm.validateFields();
      const scheduledDate = values.scheduledDate?.format('YYYY-MM-DDTHH:mm:ss');
      const issueId = selectedIssue.id || selectedIssue._id;
      if (!issueId) {
        message.error('Selected issue does not have a valid ID');
        return;
      }
      await scheduleMaintenanceFromIssue(issueId, {
        scheduledDate,
        estimatedCost: values.estimatedCost ?? 0,
      });
      message.success('Maintenance scheduled from reported issue');
      setScheduleOpen(false);
      setSelectedIssue(null);
      setActiveTab('records');
      load();
    } catch (err) {
      if (err?.errorFields) return;
      const backendMessage =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message;
      message.error(backendMessage || 'Failed to schedule maintenance');
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
    return (
      <Badge 
        status={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'processing' : status === 'SCHEDULED' ? 'warning' : 'error'} 
        text={status}
      />
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (val) => (
        <Text code style={{ fontSize: '12px' }}>
          {val?.substring(0, 8)}
        </Text>
      ),
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleId',
      key: 'vehicleId',
      width: 120,
      render: (val) => (
        <Space>
          <CarOutlined style={{ color: '#1890ff' }} />
          <Text strong>{val}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'maintenanceType',
      key: 'maintenanceType',
      width: 110,
      render: (type) => {
        const typeObj = MAINTENANCE_TYPES.find(t => t.value === type);
        return (
          <Tag 
            color={typeObj?.color || 'default'} 
            style={{ borderRadius: '12px', padding: '2px 10px' }}
          >
            {typeObj?.label || type || '-'}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const config = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
        return (
          <Tag 
            icon={config.icon} 
            color={config.color} 
            style={{ borderRadius: '12px', padding: '2px 12px' }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 140,
      render: (val) => (
        <Space>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text>
            {val ? new Date(val).toLocaleDateString('en-LK', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val) => (
        <Text type="secondary" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {val || '-'}
        </Text>
      ),
    },
    {
      title: 'Est. Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 110,
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#52c41a' }}>
          {val ? `LKR ${val.toFixed(2)}` : '-'}
        </Text>
      ),
    },
    {
      title: 'Recurring',
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      width: 100,
      render: (val) => (
        <Tag 
          color={val ? 'green' : 'default'} 
          style={{ borderRadius: '12px' }}
        >
          {val ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'SCHEDULED' && hasRole('REPAIR_ADVISOR', 'OWNER') && (
            <Tooltip title="Start Maintenance">
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStart(record.id)}
                style={{ borderRadius: '6px' }}
              >
                Start
              </Button>
            </Tooltip>
          )}
          {record.status === 'IN_PROGRESS' && hasRole('REPAIR_ADVISOR', 'OWNER') && (
            <Tooltip title="Complete Maintenance">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleComplete(record.id)}
                style={{ borderRadius: '6px', background: '#52c41a', borderColor: '#52c41a' }}
              >
                Complete
              </Button>
            </Tooltip>
          )}
          {hasRole('REPAIR_ADVISOR', 'OWNER') && (
            <Popconfirm
              title="Delete maintenance record"
              description="Are you sure you want to delete this record?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const issueColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (_, issue) => {
        const issueKey = issue?.id || issue?._id;
        return <Text code>{issueKey ? String(issueKey).substring(0, 8) : '-'}</Text>;
      },
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleId',
      key: 'vehicleId',
      width: 120,
      render: (val) => (
        <Space>
          <CarOutlined style={{ color: '#1890ff' }} />
          <Text strong>{val}</Text>
        </Space>
      ),
    },
    {
      title: 'Issue Type',
      dataIndex: 'issueType',
      key: 'issueType',
      width: 130,
      render: (val) => (
        <Tag color="orange" style={{ borderRadius: '12px' }}>
          {val || '-'}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val) => (
        <Text type="secondary" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {val || '-'}
        </Text>
      ),
    },
    {
      title: 'Reported Date',
      dataIndex: 'reportedDate',
      key: 'reportedDate',
      width: 140,
      render: (val) => (
        <Space>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text>
            {val
              ? new Date(val).toLocaleDateString('en-LK', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = ISSUE_STATUS_COLORS[status] || ISSUE_STATUS_COLORS.REPORTED;
        return (
          <Tag 
            icon={config.icon} 
            color={config.color} 
            style={{ borderRadius: '12px', padding: '2px 12px' }}
          >
            {status || 'REPORTED'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, issue) => (
        <Space>
          {hasRole('REPAIR_ADVISOR', 'OWNER') && issue.status !== 'SCHEDULED' && issue.status !== 'RESOLVED' && (
            <Button 
              type="link" 
              onClick={() => openScheduleIssueModal(issue)}
              icon={<CalendarOutlined />}
            >
              Schedule
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredIssues = issues.filter((issue) => {
    if (issueFilters.vehicleId && !issue.vehicleId?.includes(issueFilters.vehicleId)) {
      return false;
    }
    if (issueFilters.status && issue.status !== issueFilters.status) {
      return false;
    }
    if (issueFilters.issueType && issue.issueType !== issueFilters.issueType) {
      return false;
    }
    if (issueFilters.searchTerm) {
      const term = issueFilters.searchTerm.toLowerCase();
      const matchesDescription = issue.description?.toLowerCase().includes(term);
      const matchesType = issue.issueType?.toLowerCase().includes(term);
      const matchesReporter = issue.reportedBy?.toLowerCase().includes(term);
      if (!matchesDescription && !matchesType && !matchesReporter) {
        return false;
      }
    }
    if (issueFilters.dateFrom || issueFilters.dateTo) {
      const issueDate = issue.reportedDate ? new Date(issue.reportedDate) : null;
      if (issueDate) {
        if (issueFilters.dateFrom) {
          const fromDate =
            typeof issueFilters.dateFrom?.toDate === 'function'
              ? issueFilters.dateFrom.toDate()
              : new Date(issueFilters.dateFrom);
          if (issueDate < fromDate) {
            return false;
          }
        }
        if (issueFilters.dateTo) {
          const toDate =
            typeof issueFilters.dateTo?.toDate === 'function'
              ? issueFilters.dateTo.toDate()
              : new Date(issueFilters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (issueDate > toDate) {
            return false;
          }
        }
      }
    }
    return true;
  });

  const issueTypeOptions = Array.from(
    new Set(issues.map((issue) => issue.issueType).filter(Boolean))
  ).map((type) => ({ value: type, label: type }));

  const issueStatusOptions = [
    { value: 'REPORTED', label: 'Reported' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];

  const activeRecordsCount = records.filter(
    (record) => record.status === 'SCHEDULED' || record.status === 'IN_PROGRESS'
  ).length;

  const totalEstimatedCost = records.reduce((sum, record) => sum + (record.estimatedCost || 0), 0);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Modern Header */}
      <Card 
        style={{ 
          marginBottom: 24, 
          borderRadius: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={1} style={{ color: 'white', margin: 0, marginBottom: 8 }}>
              Maintenance Management
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
              Track reported issues and manage maintenance progress efficiently
            </Text>
          </Col>
          <Col>
            {hasRole('REPAIR_ADVISOR', 'OWNER') && (
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                style={{
                  borderRadius: 12,
                  height: 48,
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                Add Maintenance
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text type="secondary">Reported Issues</Text>}
              value={issues.length}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 32, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text type="secondary">Maintenance Records</Text>}
              value={records.length}
              prefix={<CarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 32, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text type="secondary">Active Work</Text>}
              value={activeRecordsCount}
              prefix={<SyncOutlined spin style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: 32, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text type="secondary">Total Estimated Cost</Text>}
              value={totalEstimatedCost}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="LKR"
              valueStyle={{ color: '#52c41a', fontSize: 32, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card 
        style={{ 
          marginBottom: 24, 
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ marginBottom: 24 }}>
          <Space>
            <FilterOutlined style={{ fontSize: 20, color: '#667eea' }} />
            <Title level={4} style={{ margin: 0 }}>
              {activeTab === 'issues' ? 'Issue Filters' : 'Maintenance Filters'}
            </Title>
          </Space>
          <Divider style={{ margin: '16px 0' }} />
        </div>
        {activeTab === 'issues' ? (
          <Form
            form={issueFilterForm}
            layout="vertical"
            onValuesChange={(changedValues) => handleIssueFilterChange(changedValues)}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="searchTerm" label="Search">
                  <Input
                    placeholder="Search by description, type, or reporter"
                    allowClear
                    size="large"
                    prefix={<EyeOutlined />}
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="vehicleId" label="Vehicle ID">
                  <Input
                    placeholder="Filter by vehicle"
                    allowClear
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="status" label="Issue Status">
                  <Select
                    placeholder="Select issue status"
                    options={issueStatusOptions}
                    allowClear
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="issueType" label="Issue Type">
                  <Select
                    placeholder="Select issue type"
                    options={issueTypeOptions}
                    allowClear
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]} style={{ marginTop: 8 }}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="dateFrom" label="Reported From">
                  <DatePicker
                    className="w-full"
                    placeholder="Start date"
                    format="DD/MM/YYYY"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="dateTo" label="Reported To">
                  <DatePicker
                    className="w-full"
                    placeholder="End date"
                    format="DD/MM/YYYY"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetIssueFilters}
                  size="large"
                  style={{ width: '100%', borderRadius: 10 }}
                >
                  Reset Filters
                </Button>
              </Col>
            </Row>
          </Form>
        ) : (
          <Form
            form={maintenanceFilterForm}
            layout="vertical"
            onValuesChange={(changedValues) => handleMaintenanceFilterChange(changedValues)}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="searchTerm" label="Search">
                  <Input
                    placeholder="Search by description or issue ID"
                    allowClear
                    size="large"
                    prefix={<EyeOutlined />}
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="vehicleId" label="Vehicle ID">
                  <Input
                    placeholder="Filter by vehicle"
                    allowClear
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="status" label="Status">
                  <Select
                    placeholder="Select status"
                    options={STATUS_OPTIONS}
                    allowClear
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="maintenanceType" label="Type">
                  <Select
                    placeholder="Select type"
                    options={MAINTENANCE_TYPES}
                    allowClear
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]} style={{ marginTop: 8 }}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="isRecurring" label="Recurring">
                  <Select
                    placeholder="All"
                    options={[
                      { value: true, label: 'Recurring Only' },
                      { value: false, label: 'Non-Recurring Only' },
                    ]}
                    allowClear
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="dateFrom" label="From Date">
                  <DatePicker
                    className="w-full"
                    placeholder="Start date"
                    format="DD/MM/YYYY"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="dateTo" label="To Date">
                  <DatePicker
                    className="w-full"
                    placeholder="End date"
                    format="DD/MM/YYYY"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetMaintenanceFilters}
                  size="large"
                  style={{ width: '100%', borderRadius: 10 }}
                >
                  Reset Filters
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Card>

      {/* Main Content Card */}
      <Card 
        style={{ 
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          style={{ margin: 0 }}
          items={[
            {
              key: 'issues',
              label: (
                <Space>
                  <WarningOutlined />
                  <span>Reported Issues</span>
                  <Badge count={filteredIssues.length} style={{ backgroundColor: '#faad14' }} />
                </Space>
              ),
              children: (
                <div style={{ padding: '24px' }}>
                  <div
                    style={{
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    {hasRole('REPAIR_ADVISOR', 'OWNER') && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => openDamageModal(null)}
                        size="large"
                        style={{ borderRadius: 10 }}
                      >
                        Report Issue
                      </Button>
                    )}
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={load}
                      loading={issuesLoading || loading}
                      size="large"
                      style={{ borderRadius: 10 }}
                    >
                      Refresh
                    </Button>
                  </div>
                  <Table
                    columns={issueColumns}
                    dataSource={filteredIssues}
                    rowKey={(r) => getIssueKey(r)}
                    loading={issuesLoading}
                    bordered={false}
                    size="middle"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['5', '10', '20', '50'],
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} issues`,
                    }}
                    rowClassName={(record, index) => 
                      index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                    }
                    style={{ borderRadius: 12 }}
                  />
                </div>
              ),
            },
            {
              key: 'records',
              label: (
                <Space>
                  <CarOutlined />
                  <span>Maintenance Records</span>
                  <Badge count={filteredRecords.length} style={{ backgroundColor: '#1890ff' }} />
                </Space>
              ),
              children: (
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={load}
                      loading={loading}
                      size="large"
                      style={{ borderRadius: 10 }}
                    >
                      Refresh
                    </Button>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={filteredRecords}
                    rowKey={(r) => r.id}
                    loading={loading}
                    bordered={false}
                    size="middle"
                    rowClassName={(record, index) => 
                      index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                    }
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['5', '10', '20', '50'],
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} records`,
                    }}
                    style={{ borderRadius: 12 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modals */}
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
        vehicleId={damageContext?.vehicleId}
      />

      <Modal
        title="Schedule Maintenance From Issue"
        open={scheduleOpen}
        onCancel={() => {
          setScheduleOpen(false);
          setSelectedIssue(null);
        }}
        onOk={handleScheduleFromIssue}
        okText="Schedule"
        cancelText="Cancel"
        destroyOnClose
        centered
        style={{ borderRadius: 16 }}
      >
        <Form form={scheduleForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="Issue ID">
            <Input value={selectedIssue?.id || ''} disabled size="large" />
          </Form.Item>
          <Form.Item
            name="scheduledDate"
            label="Scheduled Date"
            rules={[{ required: true, message: 'Scheduled date is required' }]}
          >
            <DatePicker 
              className="w-full" 
              format="DD/MM/YYYY HH:mm" 
              showTime 
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>
          <Form.Item
            name="estimatedCost"
            label="Estimated Cost (LKR)"
            rules={[{ required: true, message: 'Estimated cost is required' }]}
          >
            <InputNumber 
              className="w-full" 
              min={0} 
              size="large"
              style={{ borderRadius: 10 }}
              prefix="LKR"
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
}