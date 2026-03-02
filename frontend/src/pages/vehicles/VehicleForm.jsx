import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  AutoComplete,
  Button,
  App,
} from 'antd';
import { addVehicle, updateVehicle, getDistinctBrands } from '../../api/vehicleApi';

const VEHICLE_TYPES = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN', label: 'Van' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'TRUCK', label: 'Truck' },
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
];

export default function VehicleForm({ open, onClose, onSaved, vehicle }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
  const isEdit = !!vehicle;

  useEffect(() => {
    if (open) {
      loadBrands();
      if (vehicle) {
        form.setFieldsValue({
          brand: vehicle.brand,
          model: vehicle.model,
          type: vehicle.type,
          pricePerDay: vehicle.pricePerDay,
          advanceDeposit: vehicle.advanceDeposit,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, vehicle]);

  const loadBrands = async () => {
    try {
      const { data } = await getDistinctBrands();
      const list = data || [];
      setBrandOptions(
        list.map((b) => (typeof b === 'string' ? b : b.value ?? b.label ?? b))
      );
    } catch {
      setBrandOptions([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (isEdit) {
        await updateVehicle(vehicle.vehicleId, values);
        message.success('Vehicle updated');
      } else {
        await addVehicle(values);
        message.success('Vehicle added');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.errorFields) {
        return;
      }
      message.error('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {isEdit ? 'Update' : 'Add'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="brand"
          label="Brand"
          rules={[{ required: true, message: 'Please enter brand' }]}
        >
          <AutoComplete
            placeholder="Select or type brand"
            options={brandOptions.map((b) => ({ value: b, label: b }))}
            filterOption={(input, option) =>
              (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="model"
          label="Model"
          rules={[{ required: true, message: 'Please enter model' }]}
        >
          <Input placeholder="e.g. Toyota Camry" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: 'Please select type' }]}
        >
          <Select
            placeholder="Select vehicle type"
            options={VEHICLE_TYPES}
          />
        </Form.Item>

        <Form.Item
          name="pricePerDay"
          label="Price Per Day (LKR)"
          rules={[
            { required: true, message: 'Please enter price per day' },
            { type: 'number', min: 0, message: 'Price must be positive' },
          ]}
        >
          <InputNumber
            min={0}
            step={100}
            className="w-full"
            formatter={(v) =>
              v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
            }
          />
        </Form.Item>

        <Form.Item
          name="advanceDeposit"
          label="Advance Deposit (LKR)"
          rules={[
            { required: true, message: 'Please enter advance deposit' },
            { type: 'number', min: 0, message: 'Deposit must be positive' },
          ]}
        >
          <InputNumber
            min={0}
            step={100}
            className="w-full"
            formatter={(v) =>
              v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
