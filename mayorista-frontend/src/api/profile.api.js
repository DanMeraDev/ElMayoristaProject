import axios from './axios';

export const getPublicProfile = (userId) =>
    axios.get(`/users/${userId}/profile`);

export const updateMyProfile = (data) =>
    axios.put('/users/me/profile', data);

export const uploadProfilePhoto = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/users/me/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const uploadCoverPhoto = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/users/me/cover-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
