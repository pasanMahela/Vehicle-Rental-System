import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Spin, App, Divider, Tag, Steps } from 'antd';
import { 
  CreditCardOutlined, 
  CheckCircleOutlined, 
  CarOutlined,
  CalendarOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { getBookingById } from '../../api/bookingApi';
import { getVehicleById } from '../../api/vehicleApi';
import { createPaymentIntent, confirmPayment } from '../../api/paymentApi';
import { useAuth } from '../../context/AuthContext';

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51RIMlrGfArS0mgfQgo6gWkSf9e9gWt0fMZa6VKbcbJoPb7FnkTLwYNCooWjwHq0NTLeAzVv7XfZj80lthawtePEh00xqFozasx';

function PaymentForm({ booking, vehicle, onSuccess, onReturnToBookings, onCancel, isStaff, paymentAmount, paymentTypeForApi, stageForApi, paymentTypeLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentDate, setPaymentDate] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'cash'

  const amount = paymentAmount ?? booking?.remainingBalance ?? booking?.totalAmount ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || loading || amount <= 0) return;

    setLoading(true);
    setCurrentStep(1);

    try {
      const { data: intentData } = await createPaymentIntent({
        amount,
        bookingId: booking.bookingId,
        customerId: booking.customerId || booking.userId,
        currency: 'lkr',
        paymentType: paymentTypeForApi || 'RENTAL_BALANCE',
        stage: stageForApi || 'FINAL',
      });

      setCurrentStep(2);

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        await confirmPayment({
          paymentId: intentData.paymentId,
          paymentIntentId: paymentIntent.id,
        });

        setCurrentStep(3);
        setPaymentSuccess(true);
        setTransactionId(paymentIntent.id);
        setPaymentDate(new Date());

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6'],
        });

        message.success('Payment completed successfully!');
        onSuccess?.();
      }
    } catch (err) {
      setCurrentStep(0);
      message.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBill = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ORCHID VEHICLE RENTAL', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Receipt', pageWidth / 2, 32, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Transaction Info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Receipt #: ${transactionId?.slice(-12).toUpperCase() || booking?.bookingId?.slice(-8).toUpperCase()}`, 20, 55);
    doc.text(`Date: ${paymentDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 20, 55, { align: 'right' });
    doc.text(`Time: ${paymentDate?.toLocaleTimeString()}`, pageWidth - 20, 62, { align: 'right' });
    
    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 70, pageWidth - 20, 70);
    
    // Booking Details Section
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING DETAILS', 20, 82);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const detailsStartY = 92;
    const lineHeight = 8;
    
    doc.text('Booking ID:', 20, detailsStartY);
    doc.setFont('helvetica', 'bold');
    doc.text(booking?.bookingId || 'N/A', 70, detailsStartY);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Vehicle:', 20, detailsStartY + lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(vehicle ? `${vehicle.brand} ${vehicle.model}` : booking?.vehicleId || 'N/A', 70, detailsStartY + lineHeight);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Customer:', 20, detailsStartY + lineHeight * 2);
    doc.text(booking?.customerEmail || 'N/A', 70, detailsStartY + lineHeight * 2);
    
    doc.text('Rental Period:', 20, detailsStartY + lineHeight * 3);
    doc.text(`${booking?.startDate || 'N/A'} to ${booking?.endDate || 'N/A'}`, 70, detailsStartY + lineHeight * 3);
    
    // Divider
    doc.line(20, detailsStartY + lineHeight * 4 + 5, pageWidth - 20, detailsStartY + lineHeight * 4 + 5);
    
    // Payment Details Section
    const paymentStartY = detailsStartY + lineHeight * 5 + 10;
    
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 20, paymentStartY);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Total Rental Amount:', 20, paymentStartY + 12);
    doc.text(`LKR ${(booking?.totalAmount || 0).toLocaleString()}`, pageWidth - 20, paymentStartY + 12, { align: 'right' });
    
    doc.text('Advance Paid:', 20, paymentStartY + 20);
    doc.setTextColor(34, 197, 94);
    doc.text(`- LKR ${(booking?.advancePaid || 0).toLocaleString()}`, pageWidth - 20, paymentStartY + 20, { align: 'right' });
    
    doc.setTextColor(60, 60, 60);
    doc.text('Amount Paid Now:', 20, paymentStartY + 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`LKR ${amount.toLocaleString()}`, pageWidth - 20, paymentStartY + 28, { align: 'right' });
    
    // Total Box
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(20, paymentStartY + 35, pageWidth - 40, 20, 3, 3, 'F');
    
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(12);
    doc.text('PAYMENT STATUS: COMPLETED', pageWidth / 2, paymentStartY + 48, { align: 'center' });
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing Orchid Vehicle Rental!', pageWidth / 2, 250, { align: 'center' });
    doc.text('For support: support@orchid-rental.com', pageWidth / 2, 258, { align: 'center' });
    doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, 270, { align: 'center' });
    
    // Save the PDF
    doc.save(`Receipt_${booking?.bookingId?.slice(-8) || 'payment'}_${new Date().toISOString().split('T')[0]}.pdf`);
    message.success('Receipt downloaded as PDF!');
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleOutlined className="text-4xl text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-500 mb-6">
          Your payment of <span className="font-semibold text-gray-900">LKR {amount?.toLocaleString()}</span> has been processed.
        </p>
        
        {/* Receipt Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left max-w-md mx-auto shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Payment Receipt</h4>
            <Tag color="success">Paid</Tag>
          </div>
          <Divider className="my-3" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {transactionId?.slice(-12).toUpperCase() || booking?.bookingId?.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & Time</span>
              <span>{paymentDate?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle</span>
              <span className="font-medium">{vehicle ? `${vehicle.brand} ${vehicle.model}` : booking?.vehicleId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Booking ID</span>
              <span className="font-mono text-xs">{booking?.bookingId?.slice(-8).toUpperCase()}</span>
            </div>
            <Divider className="my-3" />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-gray-900">Amount Paid</span>
              <span className="font-bold text-green-600">LKR {amount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          A confirmation email has been sent to your registered email address.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button
            size="large"
            onClick={handleDownloadBill}
            className="h-12 px-6 rounded-xl"
            icon={<DownloadOutlined />}
          >
            Download Receipt
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={onReturnToBookings}
            className="h-12 px-6 rounded-xl"
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none'
            }}
          >
            Return to Payments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection - Cash only available for staff */}
      {isStaff && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setPaymentMethod('card')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCardOutlined className={`text-2xl ${paymentMethod === 'card' ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-medium ${paymentMethod === 'card' ? 'text-blue-700' : 'text-gray-700'}`}>Card Payment</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard, etc.</p>
                </div>
              </div>
            </div>
            <div
              onClick={() => setPaymentMethod('cash')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarOutlined className={`text-2xl ${paymentMethod === 'cash' ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-medium ${paymentMethod === 'cash' ? 'text-green-700' : 'text-gray-700'}`}>Cash Payment</p>
                  <p className="text-xs text-gray-500">Pay at counter (Staff only)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'card' && (
        <>
          <Steps
            current={currentStep}
            size="small"
            items={[
              { title: 'Enter Card', icon: <CreditCardOutlined /> },
              { title: 'Processing', icon: <SafetyCertificateOutlined /> },
              { title: 'Verifying', icon: <LockOutlined /> },
              { title: 'Complete', icon: <CheckCircleOutlined /> },
            ]}
          />

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Details
              </label>
              <div className={`rounded-xl border-2 bg-white p-4 transition-all ${
                cardComplete ? 'border-green-500 ring-4 ring-green-50' : 'border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50'
              }`}>
                <CardElement
                  onChange={(e) => setCardComplete(e.complete)}
                  options={{
                    hidePostalCode: true,
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    '::placeholder': { color: '#9ca3af' },
                  },
                  invalid: { color: '#ef4444' },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
          <LockOutlined className="text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Secure Payment</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>


        <div className="flex gap-4">
          <Button
            size="large"
            onClick={onCancel}
            className="h-14 px-8 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            disabled={!stripe || amount <= 0 || !cardComplete}
            className="flex-1 h-14 text-lg font-semibold rounded-xl"
            style={{ 
              background: cardComplete && !loading
                ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                : '#d1d5db',
              border: 'none'
            }}
          >
            {loading ? 'Processing...' : `Pay LKR ${amount?.toLocaleString()}`}
          </Button>
        </div>

        {!cardComplete && (
          <p className="text-center text-sm text-amber-600">
            Please enter valid card details to continue
          </p>
        )}
          </form>
        </>
      )}

      {paymentMethod === 'cash' && (
        <div className="space-y-6 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <DollarOutlined className="text-4xl text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash Payment Selected</h3>
            <p className="text-gray-600 mb-4">
              Please visit our counter to complete your payment of <strong>LKR {amount?.toLocaleString()}</strong>
            </p>
            <p className="text-sm text-amber-700">
              Booking ID: <span className="font-mono">{booking?.bookingId?.slice(-8).toUpperCase()}</span>
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              size="large"
              onClick={onCancel}
              className="h-14 px-8 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={onReturnToBookings}
              className="flex-1 h-14 text-lg font-semibold rounded-xl"
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none'
              }}
            >
              I'll Pay at Counter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { hasRole } = useAuth();
  const [booking, setBooking] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  const isStaff = hasRole('BOOKING_CASHIER', 'OWNER');
  
  // Determine payment type from URL: FULL_PAYMENT, ADVANCE_DEPOSIT, or RENTAL_BALANCE (for "Pay Remaining")
  const paymentTypeParam = searchParams.get('type') || 'RENTAL_BALANCE';

  useEffect(() => {
    const load = async () => {
      if (!bookingId) return;
      setLoading(true);
      try {
        const { data: bookingData } = await getBookingById(bookingId);
        setBooking(bookingData);
        if (bookingData?.vehicleId) {
          try {
            const { data: vehicleData } = await getVehicleById(bookingData.vehicleId);
            setVehicle(vehicleData);
          } catch {
            // vehicle might not exist
          }
        }
      } catch {
        message.error('Failed to load booking');
        navigate('/dashboard/payments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId, navigate, message]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const totalAmount = booking.totalAmount ?? 0;
  const advanceDeposit = booking.advancePaid ?? 0; // The deposit amount required
  const remainingBalanceFromBooking = booking.remainingBalance ?? 0;
  
  // Determine the amount to pay based on payment type
  let paymentAmount = 0;
  let paymentTypeLabel = '';
  let paymentTypeForApi = 'RENTAL_BALANCE';
  let stageForApi = 'FINAL';
  
  if (paymentTypeParam === 'FULL_PAYMENT') {
    paymentAmount = totalAmount;
    paymentTypeLabel = 'Full Payment';
    paymentTypeForApi = 'FULL_PAYMENT';
    stageForApi = 'FULL';
  } else if (paymentTypeParam === 'ADVANCE_DEPOSIT') {
    paymentAmount = advanceDeposit;
    paymentTypeLabel = 'Advance Deposit';
    paymentTypeForApi = 'ADVANCE_DEPOSIT';
    stageForApi = 'ADVANCE';
  } else {
    // RENTAL_BALANCE - Pay remaining
    paymentAmount = remainingBalanceFromBooking;
    paymentTypeLabel = 'Remaining Balance';
    paymentTypeForApi = 'RENTAL_BALANCE';
    stageForApi = 'FINAL';
  }
  
  // For display purposes
  const advancePaid = paymentTypeParam === 'RENTAL_BALANCE' ? advanceDeposit : 0;
  const remainingBalance = paymentAmount;
  const startDate = booking.startDate ? new Date(booking.startDate) : null;
  const endDate = booking.endDate ? new Date(booking.endDate) : null;
  const rentalDays = startDate && endDate 
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-500 mt-2">Secure checkout powered by Stripe</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Order Summary - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center gap-3 text-white">
                  <CarOutlined className="text-2xl" />
                  <div>
                    <p className="text-sm opacity-80">Vehicle</p>
                    <h3 className="text-xl font-bold">
                      {vehicle ? `${vehicle.brand} ${vehicle.model}` : booking.vehicleId}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CalendarOutlined className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rental Period</p>
                    <p className="font-medium">
                      {startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                      {' – '}
                      {endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">{rentalDays} days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <DollarOutlined className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Tag color={booking.status === 'CONFIRMED' ? 'blue' : 'orange'}>
                      {booking.status}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Total Rental</span>
                  <span>LKR {totalAmount.toLocaleString()}</span>
                </div>
                {paymentTypeParam === 'RENTAL_BALANCE' && advancePaid > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Advance Paid</span>
                    <span className="text-green-600">- LKR {advancePaid.toLocaleString()}</span>
                  </div>
                )}
                {paymentTypeParam === 'ADVANCE_DEPOSIT' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Deposit Required</span>
                    <span className="text-orange-500">LKR {advanceDeposit.toLocaleString()}</span>
                  </div>
                )}
                {paymentTypeParam === 'FULL_PAYMENT' && (
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>Payment Type</span>
                    <span className="text-green-600">Full Payment</span>
                  </div>
                )}
                <Divider className="my-3" />
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">{paymentTypeLabel}</span>
                  <span className="text-2xl font-bold text-blue-600">
                    LKR {paymentAmount.toLocaleString()}
                  </span>
                </div>
                {paymentTypeParam === 'ADVANCE_DEPOSIT' && remainingBalanceFromBooking > 0 && (
                  <div className="flex justify-between text-gray-500 text-sm mt-2">
                    <span>Remaining (Pay Later)</span>
                    <span>LKR {remainingBalanceFromBooking.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                <LockOutlined className="text-2xl text-gray-400" />
                <p className="text-xs text-gray-400 mt-1">SSL Secured</p>
              </div>
              <div className="text-center">
                <SafetyCertificateOutlined className="text-2xl text-gray-400" />
                <p className="text-xs text-gray-400 mt-1">PCI Compliant</p>
              </div>
              <div className="text-center">
                <CheckCircleOutlined className="text-2xl text-gray-400" />
                <p className="text-xs text-gray-400 mt-1">Verified</p>
              </div>
            </div>
          </div>

          {/* Payment Form - Right Side */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <CreditCardOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                  <p className="text-sm text-gray-500">Enter your card information</p>
                </div>
              </div>

              <Elements stripe={stripePromise} options={{ locale: 'en' }}>
                <PaymentForm
                  booking={booking}
                  vehicle={vehicle}
                  onSuccess={() => {}}
                  onReturnToBookings={() => navigate('/dashboard/payments')}
                  onCancel={() => navigate('/dashboard/payments')}
                  isStaff={isStaff}
                  paymentAmount={paymentAmount}
                  paymentTypeForApi={paymentTypeForApi}
                  stageForApi={stageForApi}
                  paymentTypeLabel={paymentTypeLabel}
                />
              </Elements>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          By completing this payment, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
