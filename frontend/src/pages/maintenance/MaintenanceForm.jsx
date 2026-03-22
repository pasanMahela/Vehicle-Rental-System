import { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Modal,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  Row,
  Col,
  App,
  Spin,
} from 'antd';
import { addMaintenance, updateMaintenance, checkVehicleExists } from '../../api/maintenanceApi';
import dayjs from 'dayjs';

const MAINTENANCE_TYPES = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'ACCIDENT', label: 'Accident' },
  { value: 'BREAKDOWN', label: 'Breakdown' },
];

const RECURRENCE_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export default function MaintenanceForm({
  open,
  onClose,
  onSaved,
  record,
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [validatingVehicle, setValidatingVehicle] = useState(false);
  const isEdit = !!record;
  const isRecurring = Form.useWatch('isRecurring', form);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (record) {
        form.setFieldsValue({
          vehicleId: record.vehicleId,
          maintenanceType: record.maintenanceType || 'SCHEDULED',
          description: record.description || '',
          scheduledDate: record.scheduledDate ? dayjs(record.scheduledDate) : null,
          estimatedCost: record.estimatedCost || 0,
          isRecurring: record.isRecurring || false,
          recurrencePattern: record.recurrencePattern || 'MONTHLY',
          nextDueDate: record.nextDueDate ? dayjs(record.nextDueDate) : null,
        });
      } else {
        form.setFieldsValue({
          vehicleId: '',
          maintenanceType: 'SCHEDULED',
          description: '',
          scheduledDate: null,
          estimatedCost: 0,
          isRecurring: false,
          recurrencePattern: 'MONTHLY',
          nextDueDate: null,
        });
      }
    }
  }, [open, record, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const scheduledDate = values.scheduledDate
        ? values.scheduledDate.format('YYYY-MM-DDTHH:mm:ss')
        : null;
      const safeRecurrencePattern = values.recurrencePattern || 'MONTHLY';
      const safeNextDueDate = values.nextDueDate
        ? values.nextDueDate.format('YYYY-MM-DD')
        : (values.scheduledDate ? values.scheduledDate.add(1, 'month').format('YYYY-MM-DD') : null);

      const payload = {
        vehicleId: values.vehicleId,
        maintenanceType: values.maintenanceType,
        description: values.description || '',
        scheduledDate,
        estimatedCost: values.estimatedCost || 0,
        // Backend currently forces this endpoint to recurring and switches on recurrencePattern.
        // Always provide safe defaults to prevent null switch errors.
        isRecurring: true,
        recurrencePattern: safeRecurrencePattern,
        nextDueDate: safeNextDueDate,
      };

      if (isEdit) {
        await updateMaintenance(record.id, payload);
        message.success('Maintenance updated');
      } else {
        await addMaintenance(payload);
        message.success('Maintenance scheduled');
      }
      onSaved();
    } catch (err) {
      if (err?.errorFields) return;
      const backendMessage =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message;
      message.error(
        backendMessage ||
          (isEdit ? 'Failed to update maintenance' : 'Failed to schedule maintenance')
      );
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Maintenance' : 'Schedule Maintenance'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Update' : 'Schedule'}
      cancelText="Cancel"
      destroyOnClose
      maskClosable={false}
      width={700}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="vehicleId"
              label="Vehicle ID"
              rules={[
                { required: true, message: 'Vehicle ID is required' },
                {
                  validator: (_, value) => {
                    if (!value || isEdit) return Promise.resolve();
                    setValidatingVehicle(true);
                    return checkVehicleExists(value)
                      .then(() => {
                        setValidatingVehicle(false);
                        return Promise.resolve();
                      })
                      .catch((err) => {
                        setValidatingVehicle(false);
                        return Promise.reject(
                          new Error('Vehicle not found. Please enter a valid vehicle ID.')
                        );
                      });
                  },
                  validateTrigger: 'onBlur',
                },
              ]}
            >
              <Input
                placeholder="Enter vehicle ID"
                disabled={isEdit || validatingVehicle}
                onBlur={() => form.validateFields(['vehicleId'])}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="maintenanceType"
              label="Maintenance Type"
              rules={[{ required: true, message: 'Type is required' }]}
            >
              <Select
                placeholder="Select maintenance type"
                options={MAINTENANCE_TYPES}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Description is required' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Describe the maintenance work required"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="scheduledDate"
              label="Scheduled Date"
              rules={[{ required: true, message: 'Scheduled date is required' }]}
            >
              <DatePicker
                className="w-full"
                placeholder="Select date"
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="estimatedCost"
              label="Estimated Cost (LKR)"
              rules={[{ required: true, message: 'Estimated cost is required' }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder="Enter amount"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value?.replace(/,/g, '') ?? 0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="isRecurring" label="Is this recurring maintenance?" valuePropName="checked">
          <Switch />
        </Form.Item>

        {isRecurring && (
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="recurrencePattern"
                label="Recurrence Pattern"
                rules={[{ required: true, message: 'Pattern is required' }]}
              >
                <Select
                  placeholder="Select pattern"
                  options={RECURRENCE_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nextDueDate"
                label="Next Due Date"
                rules={[{ required: true, message: 'Next due date is required' }]}
              >
                <DatePicker
                  className="w-full"
                  placeholder="Select date"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
}
