import api from './axios';

export const sendNotification = (data) => api.post('/api/notifications/send', data);
export const getUserNotifications = (userId) => api.get(`/api/notifications/user/${userId}`);
export const getUnreadCount = (userId) => api.get(`/api/notifications/user/${userId}/unread-count`);
export const markAsRead = (notificationId) => api.put(`/api/notifications/${notificationId}/read`);
export const markAllAsRead = (userId) => api.put(`/api/notifications/user/${userId}/read-all`);
