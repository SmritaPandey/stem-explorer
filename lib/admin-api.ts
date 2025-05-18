import api from './api';

// Dashboard API
export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

// Users API
export const getUsers = async (params?: any) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const getUser = async (userId: number) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: number, userData: any) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

// Programs API
export const createProgram = async (programData: any) => {
  const response = await api.post('/programs', programData);
  return response.data;
};

export const updateProgram = async (programId: number, programData: any) => {
  const response = await api.put(`/programs/${programId}`, programData);
  return response.data;
};

export const deleteProgram = async (programId: number) => {
  const response = await api.delete(`/programs/${programId}`);
  return response.data;
};

// Bookings API
export const getAdminBookings = async (params?: any) => {
  const response = await api.get('/admin/bookings', { params });
  return response.data;
};

export const updateBookingStatus = async (bookingId: number, status: string) => {
  const response = await api.put(`/admin/bookings/${bookingId}`, { status });
  return response.data;
};

// Materials API
export const getAllMaterials = async () => {
  const response = await api.get('/materials');
  return response.data;
};

export const uploadMaterial = async (formData: FormData) => {
  const response = await api.post('/materials', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateMaterial = async (materialId: number, materialData: any) => {
  const response = await api.put(`/materials/${materialId}`, materialData);
  return response.data;
};

export const deleteMaterial = async (materialId: number) => {
  const response = await api.delete(`/materials/${materialId}`);
  return response.data;
};

// Analytics API
export const getRevenueAnalytics = async () => {
  const response = await api.get('/admin/analytics/revenue');
  return response.data;
};

export const getProgramAnalytics = async () => {
  const response = await api.get('/admin/analytics/programs');
  return response.data;
};

export const getUserAnalytics = async () => {
  const response = await api.get('/admin/analytics/users');
  return response.data;
};
