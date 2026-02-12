import axios from './axios';

const API_URL = '/fiados';

export const createFiado = async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const getMyFiados = async () => {
    const response = await axios.get(`${API_URL}/my-fiados`);
    return response.data;
};

export const deleteFiado = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};
