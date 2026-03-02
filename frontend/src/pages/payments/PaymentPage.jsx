import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, App } from 'antd';
import { Canvas } from '@react-three/fiber';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import confetti from 'canvas-confetti';
import { getBookingById } from '../../api/bookingApi';
import { getVehicleById } from '../../api/vehicleApi';
import { createPaymentIntent, confirmPayment } from '../../api/paymentApi';
import PaymentCard3D from '../../components/PaymentCard3D';
import PaymentTimeline from '../../components/PaymentTimeline';

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51RIMlrGfArS0mgfQgo6gWkSf9e9gWt0fMZa6VKbcbJoPb7FnkTLwYNCooWjwHq0NTLeAzVv7XfZj80lthawtePEh00xqFozasx';

function PaymentForm({
  booking,
  vehicle,
  onSuccess,
  onError,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const receiptRef = useRef(null);

  const amount = booking?.remainingBalance ?? booking?.totalAmount ?? 0;
  const bookingRef = booking?.bookingId?.slice(-8) ?? '---';

  const handleMouseMove = useCallback(
    (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = -((e.clientY - rect.top) / rect.height - 0.5);
      setMousePos({ x, y });
    },
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || loading || amount <= 0) return;

    setLoading(true);
    setIsError(false);
    setIsFlipped(true);
    setCurrentStep(1);

    try {
      const { data: intentData } = await createPaymentIntent({
        amount,
        bookingId: booking.bookingId,
        currency: 'lkr',
      });

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

        setIsFlipped(false);
        setIsSuccess(true);
        setCurrentStep(2);

        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          setShowReceipt(true);
        }, 300);
        onSuccess?.();
        message.success('Payment successful!');
      }
    } catch (err) {
      setIsFlipped(false);
      setIsError(true);
      setCurrentStep(0);
      message.error(err.message || 'Payment failed');
      onError?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      className="relative"
    >
      <div className="h-[220px] w-full">
        <Canvas camera={{ position: [0, 0, 4], fov: 35 }} dpr={[1, 2]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <PaymentCard3D
            isFlipped={isFlipped}
            isSuccess={isSuccess}
            isError={isError}
            bookingRef={bookingRef}
            cardType="VISA"
            mousePos={mousePos}
          />
        </Canvas>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': { color: '#aab7c4' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-500">
          Test card: 4242 4242 4242 4242 | Any future date | Any CVC
        </p>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          disabled={!stripe || amount <= 0}
          block
          className="h-12"
        >
          Pay LKR {amount?.toLocaleString()}
        </Button>
      </form>

      <div className="mt-8">
        <PaymentTimeline currentStep={currentStep} />
      </div>

      {showReceipt && (
        <div
          ref={receiptRef}
          className="mt-8 animate-slide-up rounded-xl border border-green-200 bg-green-50 p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-green-800">
            Payment Receipt
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-gray-600">Paid amount:</span>{' '}
              LKR {amount?.toLocaleString()}
            </p>
            <p>
              <span className="font-medium text-gray-600">Booking ID:</span>{' '}
              {booking?.bookingId}
            </p>
            {booking?.finalPaymentDone === false &&
              (booking?.remainingBalance ?? 0) > 0 && (
                <p>
                  <span className="font-medium text-gray-600">
                    Remaining balance:
                  </span>{' '}
                  LKR {(booking?.remainingBalance ?? 0).toLocaleString()}
                </p>
              )}
            <p className="mt-4 text-green-700">
              Receipt sent to email
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [booking, setBooking] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

  useEffect(() => {
    const load = async () => {
      if (!bookingId) return;
      setLoading(true);
      try {
        const { data: bookingData } = await getBookingById(bookingId);
        setBooking(bookingData);
        if (bookingData?.vehicleId) {
          try {
            const { data: vehicleData } = await getVehicleById(
              bookingData.vehicleId
            );
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
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const remainingBalance = booking.remainingBalance ?? 0;
  const totalAmount = booking.totalAmount ?? 0;
  const advancePaid = booking.advancePaid ?? 0;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Complete Payment
      </h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="Booking Summary" className="h-fit">
          <div className="space-y-4">
            {vehicle && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Vehicle
                </p>
                <p className="font-semibold">
                  {vehicle.brand} {vehicle.model}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">
                Rental Period
              </p>
              <p>
                {booking.startDate
                  ? new Date(booking.startDate).toLocaleDateString()
                  : '-'}{' '}
                –{' '}
                {booking.endDate
                  ? new Date(booking.endDate).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Amount
              </p>
              <p className="font-semibold">
                LKR {totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Advance Paid
              </p>
              <p>LKR {advancePaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Remaining Balance
              </p>
              <p className="font-semibold text-blue-600">
                LKR {remainingBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Payment">
          <Elements
            stripe={stripePromise}
            options={{ locale: 'en' }}
          >
            <PaymentForm
              booking={booking}
              vehicle={vehicle}
              onSuccess={() => {}}
            />
          </Elements>
        </Card>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
