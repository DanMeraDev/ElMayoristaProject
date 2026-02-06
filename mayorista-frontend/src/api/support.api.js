import axios from './axios';

const API_URL = '/support';

// Create a new support ticket
export const createTicket = async (ticketData) => {
    const response = await axios.post(`${API_URL}/tickets`, ticketData);
    return response.data;
};

// Get current seller's tickets
export const getMyTickets = async () => {
    const response = await axios.get(`${API_URL}/my-tickets`);
    return response.data;
};

// Get all tickets (admin only)
export const getAllTickets = async (status = null, type = null) => {
    const params = {};
    if (status) params.status = status;
    if (type) params.type = type;

    const response = await axios.get(`${API_URL}/tickets`, { params });
    return response.data;
};

// Update ticket status (admin only)
export const updateTicketStatus = async (ticketId, status, adminNotes = null) => {
    const response = await axios.put(`${API_URL}/tickets/${ticketId}/status`, {
        status,
        adminNotes
    });
    return response.data;
};
