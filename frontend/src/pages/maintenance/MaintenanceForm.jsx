import { useEffect } from 'react';
import { Form, Input, Modal } from 'antd';
import { addMaintenance, updateMaintenance } from '../../api/maintenanceApi';
import { App } from 'antd';

export default function MaintenanceForm({
  open,
  onClose,
  onSaved,
  record,
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!record;

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (record) {
        form.setFieldsValue({
          vehicleId: record.vehicleId,
          bookingId: record.bookingId ?? '',
          description: record.description ?? '',
        });
      } else {
        form.setFieldsValue({
          vehicleId: '',
          bookingId: '',
          description: '',
        });
      }
    }
  }, [open, record, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        vehicleId: values.vehicleId,
        description: values.description || '',
      };
      if (values.bookingId) payload.bookingId = values.bookingId;

      if (isEdit) {
        await updateMaintenance(record.maintenanceId ?? record.id, payload);
        message.success('Maintenance updated');
      } else {
        await addMaintenance(payload);
        message.success('Maintenance added');
      }
      onSaved();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(isEdit ? 'Failed to update maintenance' : 'Failed to add maintenance');
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Maintenance' : 'Add Maintenance'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Update' : 'Add'}
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="vehicleId"
          label="Vehicle ID"
          rules={[{ required: true, message: 'Vehicle ID is required' }]}
        >
          <Input placeholder="Enter vehicle ID" disabled={isEdit} />
        </Form.Item>

        <Form.Item name="bookingId" label="Booking ID (optional)">
          <Input placeholder="Enter booking ID" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Enter description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
