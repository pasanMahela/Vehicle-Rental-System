import { useEffect } from 'react';
import { Form, Input, Select, Modal } from 'antd';
import { reportIssue } from '../../api/maintenanceApi';
import { App } from 'antd';

const ISSUE_TYPES = [
  { value: 'ENGINE_PROBLEM', label: 'Engine Problem' },
  { value: 'TIRE_ISSUE', label: 'Tire Issue' },
  { value: 'BRAKE_ISSUE', label: 'Brake Issue' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'SUSPENSION', label: 'Suspension' },
  { value: 'ACCIDENT_DAMAGE', label: 'Accident Damage' },
  { value: 'BODY_DAMAGE', label: 'Body Damage' },
  { value: 'INTERIOR_DAMAGE', label: 'Interior Damage' },
  { value: 'OTHER', label: 'Other' },
];

export default function DamageForm({
  open,
  onClose,
  onSaved,
  vehicleId,
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        vehicleId: vehicleId || '',
        issueType: undefined,
        description: '',
      });
    }
  }, [open, vehicleId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        vehicleId: values.vehicleId,
        issueType: values.issueType,
        description: values.description || '',
        reportedDate: new Date().toISOString(),
      };

      await reportIssue(payload);
      message.success('Issue reported successfully');
      onSaved();
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Failed to report issue');
    }
  };

  return (
    <Modal
      title="Report Vehicle Issue"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Report"
      destroyOnClose
      maskClosable={false}
      width={600}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="vehicleId"
          label="Vehicle ID"
          rules={[{ required: true, message: 'Vehicle ID is required' }]}
        >
          <Input
            placeholder="Enter vehicle ID"
            disabled={!!vehicleId}
          />
        </Form.Item>

        <Form.Item
          name="issueType"
          label="Issue Type"
          rules={[{ required: true, message: 'Issue type is required' }]}
        >
          <Select
            placeholder="Select issue type"
            options={ISSUE_TYPES}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Description is required' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Describe the issue in detail"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
