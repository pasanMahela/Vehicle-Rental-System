import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Typography, Tag, Spin, Result, App, Badge } from 'antd';
import { CarOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { getAvailableVehicles } from '../../api/vehicleApi';
import BookingForm from '../bookings/BookingForm';

const { Title, Text } = Typography;

export default function CustomerVehicleList() {
  const { message } = App.useApp();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await getAvailableVehicles();
      setVehicles(res.data || []);
    } catch {
      message.error('Failed to load available vehicles');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleBookNow = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setBookingFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Result
        status="info"
        title="No Vehicles Available"
        subTitle="Sorry, all our vehicles are currently booked or under maintenance. Please check back later."
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 text-center bg-blue-50/50 p-8 rounded-2xl border border-blue-100 shadow-sm">
        <Title level={2} className="!mb-2 text-gray-800">Available Vehicles</Title>
        <p className="text-gray-500 text-lg">Choose your perfect ride and book it instantly.</p>
      </div>

      <Row gutter={[24, 24]}>
        {vehicles.map((v) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={v.vehicleId}>
            <Card
              hoverable
              className="h-full overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300 border-gray-100"
              styles={{ body: { padding: 0 } }}
            >
              <div className="bg-gray-50 h-32 flex items-center justify-center border-b border-gray-100">
                <CarOutlined className="text-6xl text-gray-300" />
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-0 leading-tight">
                      {v.brand} {v.model}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Tag color="blue" className="rounded-xl px-2 m-0 border-0">{v.type || 'Standard'}</Tag>
                      <span className="text-xs text-gray-400 font-mono">{v.vehicleId}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 mb-5 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <Text type="secondary">Daily Rate</Text>
                    <span className="font-semibold text-gray-800">LKR {v.pricePerDay?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <Text type="secondary">Deposit</Text>
                    <span className="text-orange-500 font-medium">LKR {v.advanceDeposit?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <Button 
                    type="primary" 
                    block 
                    size="large"
                    icon={<SafetyCertificateOutlined />}
                    className="shadow-sm font-medium h-11"
                    onClick={() => handleBookNow(v.vehicleId)}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* We reuse the BookingForm but we can override the initial vehicle if we want */}
      <BookingForm 
        open={bookingFormOpen} 
        onClose={() => setBookingFormOpen(false)} 
        onSaved={loadVehicles} 
        initialVehicleId={selectedVehicleId}
      />
    </div>
  );
}
