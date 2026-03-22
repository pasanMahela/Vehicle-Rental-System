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
  Row,
  Col,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
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
        // Delay slightly so the modal mounts the inputs before setting values
        setTimeout(() => {
          form.setFieldsValue({
            vehicleId: vehicle.vehicleId,
            brand: vehicle.brand,
            model: vehicle.model,
            type: vehicle.type,
            pricePerDay: vehicle.pricePerDay,
            advanceDeposit: vehicle.advanceDeposit,
            imageUrl: vehicle.imageUrl,
          });
        }, 50);
      } else {
        form.resetFields();
      }
    }
  }, [open, vehicle, form]);

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

  const uploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG/WEBP files!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
         form.setFieldsValue({ imageUrl: reader.result });
      };
      
      return false; // Prevent default HTTP upload behavior
    },
    maxCount: 1,
    accept: "image/*"
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      onCancel={handleClose}
      width={700}
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
        className="mt-4"
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="vehicleId"
              label="Vehicle No (ID)"
              rules={[{ required: true, message: 'Please enter vehicle ID or Number Plate' }]}
            >
              <Input placeholder="e.g. CAB-1234 or V100" disabled={isEdit} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="model"
              label="Model"
              rules={[{ required: true, message: 'Please enter model' }]}
            >
              <Input placeholder="e.g. Camry" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
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
          </Col>

          <Col xs={24} md={12}>
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
          </Col>

          <Col xs={24} md={12}>
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
          </Col>

          <Col xs={24}>
            <Form.Item
              name="imageUrl"
              label="Vehicle Image"
              rules={[{ required: false }]}
              valuePropName="file"
              getValueProps={(val) => {
                if (val && typeof val === 'string') {
                  // Keep the existing image for display somehow, but Upload deals with `fileList`. 
                  // Because we map to a base64 string, we don't strict-bind value
                  return {};
                }
                return {};
              }}
            >
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Select Image from PC</Button>
              </Upload>
            </Form.Item>
            {/* Display old/selected image immediately if a string exists */}
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.imageUrl !== cur.imageUrl}>
              {() => {
                const img = form.getFieldValue('imageUrl');
                return img ? (
                  <div className="mt-2">
                    <img src={img} alt="Vehicle Preview" style={{ maxHeight: 150, borderRadius: 8, objectFit: 'cover' }} />
                  </div>
                ) : null;
              }}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
