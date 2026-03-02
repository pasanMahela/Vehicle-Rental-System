import api from './axios';

export const getAllBookings = () => api.get('/api/bookings');
export const getBookingsByCustomer = (customerId) => api.get(`/api/bookings/customer/${customerId}`);
export const getBookingById = (id) => api.get(`/api/bookings/${id}`);
export const createBooking = (data) => api.post('/api/bookings', data);
export const updateBooking = (id, data) => api.put(`/api/bookings/${id}`, data);
export const cancelBooking = (id) => api.put(`/api/bookings/${id}/cancel`);
export const completeBooking = (id) => api.put(`/api/bookings/${id}/complete`);
