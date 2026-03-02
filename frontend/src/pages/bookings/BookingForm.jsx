import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  App,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { createBooking } from '../../api/bookingApi';
import { getAvailableVehicles } from '../../api/vehicleApi';

const { RangePicker } = DatePicker;

const formatLKR = (val) =>
  val != null ? val.toLocaleString('en-LK') : '0';

export default function BookingForm({ open, onClose, onSaved }) {
  const { user, hasRole } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const selectedVehicleData = vehicles.find((v) => v.vehicleId === selectedVehicle);

  const days = dateRange
    ? Math.max(
        0,
        dateRange[1].diff(dateRange[0], 'day') + 1
      )
    : 0;

  const totalAmount =
    selectedVehicleData?.pricePerDay != null && days > 0
      ? selectedVehicleData.pricePerDay * days
      : 0;

  const advanceRequired = selectedVehicleData?.advanceDeposit ?? 0;
  const remainingBalance = Math.max(0, totalAmount - advanceRequired);

  useEffect(() => {
    if (open) {
      getAvailableVehicles()
        .then(({ data }) => setVehicles(data || []))
        .catch(() => message.error('Failed to load vehicles'));

      form.resetFields();
      setSelectedVehicle(null);
      setDateRange(null);
      form.setFieldsValue({
        customerEmail: user?.email || '',
        customerId: hasRole('BOOKING_CASHIER', 'OWNER') ? '' : user?.userId,
      });
    }
  }, [open, user, hasRole, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const range = values.dateRange || dateRange;
      const [startDate, endDate] = range || [];

      if (!startDate || !endDate) {
        message.error('Please select start and end dates');
        return;
      }

      setLoading(true);

      const payload = {
        vehicleId: values.vehicleId,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        customerEmail: values.customerEmail,
      };

      if (hasRole('BOOKING_CASHIER', 'OWNER') && values.customerId) {
        payload.customerId = values.customerId;
      }

      await createBooking(payload);
      message.success('Booking created');
      onSaved();
      onClose();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const vehicleOptions = vehicles.map((v) => ({
    value: v.vehicleId,
    label: `${v.brand || ''} ${v.model || ''}`.trim() + ` - LKR ${formatLKR(v.pricePerDay)}/day`,
  }));

  return (
    <Modal
      title="New Booking"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Create Booking"
      width={480}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          customerEmail: user?.email || '',
        }}
      >
        <Form.Item
          name="vehicleId"
          label="Vehicle"
          rules={[{ required: true, message: 'Please select a vehicle' }]}
        >
          <Select
            placeholder="Select an available vehicle"
            options={vehicleOptions}
            showSearch
            optionFilterProp="label"
            onChange={setSelectedVehicle}
          />
        </Form.Item>

        {selectedVehicleData && (
          <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <strong>Advance deposit:</strong> LKR {formatLKR(selectedVehicleData.advanceDeposit)}
          </div>
        )}

        <Form.Item
          name="dateRange"
          label="Period"
          rules={[{ required: true, message: 'Please select start and end dates' }]}
        >
          <RangePicker
            className="w-full"
            onChange={(dates) => setDateRange(dates)}
            disabledDate={(current) =>
              current && current < dayjs().startOf('day')
            }
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="customerEmail"
          label="Customer Email"
          rules={[
            { required: true, message: 'Please enter customer email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="customer@example.com" type="email" />
        </Form.Item>

        {hasRole('BOOKING_CASHIER', 'OWNER') && (
          <Form.Item name="customerId" label="Customer ID (optional)">
            <Input placeholder="Customer user ID" />
          </Form.Item>
        )}

        {(totalAmount > 0 || advanceRequired > 0) && (
          <>
            <Divider>Booking Summary</Divider>
            <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">LKR {formatLKR(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Advance Required:</span>
                <span className="font-medium">LKR {formatLKR(advanceRequired)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Balance:</span>
                <span className="font-medium">LKR {formatLKR(remainingBalance)}</span>
              </div>
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
}
