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

export const getNotificationHistory = (page = 0, size = 20, readFilter = null) => {
    let url = `/notifications/history?page=${page}&size=${size}`;
    if (readFilter === 'read') url += '&read=true';
    else if (readFilter === 'unread') url += '&read=false';
    return axios.get(url);
};
