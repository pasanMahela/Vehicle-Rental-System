import api from './axios';

export const getAllMaintenance = () => api.get('/api/maintenance');
export const addMaintenance = (data) => api.post('/api/maintenance', data);
export const updateMaintenance = (id, data) => api.put(`/api/maintenance/${id}`, data);
export const deleteMaintenance = (id) => api.delete(`/api/maintenance/${id}`);
export const getMaintenanceByVehicle = (vehicleId) => api.get(`/api/maintenance/vehicle/${vehicleId}`);
export const createInspection = (data) => api.post('/api/maintenance/inspect', data);
export const recordDamage = (id, data) => api.post(`/api/maintenance/${id}/damage`, data);
export const completeMaintenance = (id) => api.put(`/api/maintenance/${id}/complete`);
export const getDamages = (id) => api.get(`/api/maintenance/${id}/damages`);
