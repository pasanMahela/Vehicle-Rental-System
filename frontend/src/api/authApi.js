import api from './axios';

export const login = (data) => api.post('/api/auth/login', data);
export const register = (data) => api.post('/api/auth/register', data);
export const verifyEmail = (data) => api.post('/api/auth/verify', data);
export const resendCode = (data) => api.post('/api/auth/resend-code', data);
export const validateToken = (token) => api.get(`/api/auth/validate?token=${token}`);
export const getUsers = () => api.get('/api/auth/users');
export const getUserById = (id) => api.get(`/api/auth/users/${id}`);
export const updateUserRole = (id, role) => api.put(`/api/auth/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/api/auth/users/${id}`);
