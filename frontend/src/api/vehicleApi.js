import api from './axios';

export const getAllVehicles = () => api.get('/api/vehicles');
export const getAvailableVehicles = () => api.get('/api/vehicles/available');
export const getVehicleById = (id) => api.get(`/api/vehicles/${id}`);
export const addVehicle = (data) => api.post('/api/vehicles', data);
export const updateVehicle = (id, data) => api.put(`/api/vehicles/${id}`, data);
export const deleteVehicle = (id) => api.delete(`/api/vehicles/${id}`);
export const updateVehicleStatus = (id, status) => api.put(`/api/vehicles/${id}/status`, { status });
export const getDistinctBrands = () => api.get('/api/vehicles/brands');
export const getDistinctTypes = () => api.get('/api/vehicles/types');
export const getSettings = () => api.get('/api/vehicles/settings');
export const updateSettings = (data) => api.put('/api/vehicles/settings', data);
