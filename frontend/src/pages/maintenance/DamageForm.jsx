import { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Modal } from 'antd';
import { recordDamage } from '../../api/maintenanceApi';
import { App } from 'antd';

const DAMAGE_TYPES = [
  { value: 'SCRATCH', label: 'Scratch' },
  { value: 'ENGINE', label: 'Engine' },
  { value: 'TIRE', label: 'Tire' },
  { value: 'INTERIOR', label: 'Interior' },
];

export default function DamageForm({
  open,
  onClose,
  onSaved,
  inspectionId,
  vehicleId,
  bookingId,
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        damageType: undefined,
        description: '',
        estimatedCost: undefined,
      });
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        damageType: values.damageType,
        description: values.description || '',
        estimatedCost: values.estimatedCost ?? 0,
        vehicleId,
        bookingId: bookingId ?? undefined,
      };

      await recordDamage(inspectionId, payload);
      message.success('Damage recorded');
      onSaved();
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Failed to record damage');
    }
  };

  return (
    <Modal
      title="Record Damage"
      open={open && !!inspectionId}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Record"
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="damageType"
          label="Damage Type"
          rules={[{ required: true, message: 'Damage type is required' }]}
        >
          <Select
            placeholder="Select damage type"
            options={DAMAGE_TYPES}
            allowClear
          />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Enter damage description" />
        </Form.Item>

        <Form.Item
          name="estimatedCost"
          label="Estimated Cost (LKR)"
          rules={[{ required: true, message: 'Estimated cost is required' }]}
        >
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Enter amount in LKR"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') ?? 0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
