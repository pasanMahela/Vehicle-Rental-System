import { useEffect, useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Button,
  App,
  Spin,
  Result,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getSettings, updateSettings } from '../../api/vehicleApi';

const VEHICLE_TYPES = [
  { key: 'SEDAN', label: 'Sedan' },
  { key: 'SUV', label: 'SUV' },
  { key: 'VAN', label: 'Van' },
  { key: 'ELECTRIC', label: 'Electric' },
  { key: 'TRUCK', label: 'Truck' },
  { key: 'MOTORCYCLE', label: 'Motorcycle' },
];

export default function Settings() {
  const { hasRole } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      const data = res.data || {};
      const values = {};
      VEHICLE_TYPES.forEach(({ key }) => {
        values[key] = data[key] ?? data[`advanceDeposit${key}`] ?? 0;
      });
      form.setFieldsValue(values);
    } catch {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateSettings(values);
      message.success('Settings saved');
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!hasRole('OWNER')) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="Only owners can access settings."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold m-0">Settings</h2>
        <p className="text-gray-500 m-0 mt-1">
          Configure advance deposits per vehicle type (LKR)
        </p>
      </div>

      <Card className="shadow-sm">
        <Form form={form} layout="vertical">
          {VEHICLE_TYPES.map(({ key, label }) => (
            <Form.Item
              key={key}
              name={key}
              label={`${label} - Advance Deposit (LKR)`}
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 0, message: 'Must be ≥ 0' },
              ]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder={`Enter amount in LKR`}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') ?? 0}
              />
            </Form.Item>
          ))}

          <Form.Item className="mb-0 mt-6">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
