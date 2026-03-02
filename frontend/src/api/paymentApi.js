import api from './axios';

export const getAllPayments = () => api.get('/api/payments');
export const getPaymentsByBooking = (bookingId) => api.get(`/api/payments/booking/${bookingId}`);
export const getPaymentsByCustomer = (customerId) => api.get(`/api/payments/customer/${customerId}`);
export const createPayment = (data) => api.post('/api/payments', data);
export const refundPayment = (id) => api.post(`/api/payments/${id}/refund`);
export const createPaymentIntent = (data) => api.post('/api/payments/create-intent', data);
export const confirmPayment = (data) => api.post('/api/payments/confirm', data);
