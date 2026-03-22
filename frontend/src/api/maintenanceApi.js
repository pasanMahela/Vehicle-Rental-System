import api from './axios';

export const getAllMaintenance = () => api.get('/api/maintenance/history/all');
export const addMaintenance = (data) => api.post('/api/maintenance/scheduled', data);
export const updateMaintenance = (id, data) => api.put(`/api/maintenance/${id}/status`, data);
export const deleteMaintenance = (id) => api.delete(`/api/maintenance/records/${id}`);
export const getMaintenanceByVehicle = (vehicleId) => api.get(`/api/maintenance/history/vehicle/${vehicleId}`);
export const startMaintenance = (id) => api.put(`/api/maintenance/${id}/start`);
export const completeMaintenance = (id, data) => api.put(`/api/maintenance/${id}/complete`, data);
export const reportIssue = (data) => api.post('/api/maintenance/issues/report', data);
export const getAllIssues = () => api.get('/api/maintenance/issues/all');
export const getIssuesByVehicle = (vehicleId) => api.get(`/api/maintenance/issues/vehicle/${vehicleId}`);
export const getIssueById = (issueId) => api.get(`/api/maintenance/issues/${issueId}`);
export const scheduleMaintenanceFromIssue = (issueId, data) =>
	api.post(`/api/maintenance/schedule-from-issue/${issueId}`, data);
export const checkVehicleExists = (vehicleId) =>
	api.get(`/api/vehicles/${vehicleId}`);
