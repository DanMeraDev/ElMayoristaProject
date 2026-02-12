import axios from './axios';

export const getNotifications = async () => {
    const response = await axios.get('/notifications');
    return response.data;
};

export const getUnreadCount = async () => {
    const response = await axios.get('/notifications/unread-count');
    return response.data.count;
};

export const markAsRead = async (id) => {
    await axios.put(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
    await axios.put('/notifications/read-all');
};
