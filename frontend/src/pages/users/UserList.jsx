import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Select,
  Modal,
  Form,
  Input,
  App,
  Card,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import {
  getUsers,
  updateUserRole,
  deleteUser,
  register,
} from '../../api/authApi';

const ROLE_COLORS = {
  CUSTOMER: 'blue',
  BOOKING_CASHIER: 'green',
  REPAIR_ADVISOR: 'orange',
  OWNER: 'red',
};

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'BOOKING_CASHIER', label: 'Booking Cashier' },
  { value: 'REPAIR_ADVISOR', label: 'Repair Advisor' },
  { value: 'OWNER', label: 'Owner' },
];

export default function UserList() {
  const { hasRole } = useAuth();
  const { message } = App.useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      message.success('Role updated');
      load();
    } catch {
      message.error('Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success('User deleted');
      load();
    } catch {
      message.error('Failed to delete user');
    }
  };

  const handleAddUser = async () => {
    try {
      const values = await addForm.validateFields();
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      message.success('User added');
      setAddModalOpen(false);
      addForm.resetFields();
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Failed to add user');
    }
  };

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      render: (val, r) => val ?? r.id ?? '-',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={ROLE_COLORS[role] || 'default'}>{role ?? '-'}</Tag>
      ),
    },
    {
      title: 'Verified',
      dataIndex: 'verified',
      key: 'verified',
      render: (val) => (
        <Tag color={val ? 'success' : 'default'}>
          {val ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Change Role',
      key: 'changeRole',
      width: 160,
      render: (_, record) => (
        <Select
          size="small"
          value={record.role}
          options={ROLE_OPTIONS}
          onChange={(val) => handleRoleChange(record.userId ?? record.id, val)}
          style={{ width: 140 }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Delete user"
          description="Are you sure you want to delete this user?"
          onConfirm={() => handleDelete(record.userId ?? record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold m-0">User Management</h2>
        {hasRole('OWNER') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
          >
            Add User
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={users}
          rowKey={(r) => r.userId ?? r.id}
          loading={loading}
          rowClassName={() => 'hover:bg-blue-50/50 transition-colors'}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
        />
      </Card>

      <Modal
        title="Add User"
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          addForm.resetFields();
        }}
        onOk={handleAddUser}
        okText="Add"
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" className="mt-4">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Role is required' }]}
          >
            <Select placeholder="Select role" options={ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
