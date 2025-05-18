import api from './api';

// Programs API
export const getPrograms = async (params?: any) => {
  const response = await api.get('/programs', { params });
  return response.data;
};

export const getProgram = async (id: number) => {
  const response = await api.get(`/programs/${id}`);
  return response.data;
};

// Bookings API
export const getBookings = async () => {
  const response = await api.get('/bookings');
  return response.data;
};

export const createBooking = async (programId: number) => {
  const response = await api.post('/bookings', { programId });
  return response.data;
};

export const cancelBooking = async (bookingId: number) => {
  const response = await api.put(`/bookings/${bookingId}`, { status: 'Cancelled' });
  return response.data;
};

// Payments API
export const createPaymentIntent = async (programId: number, bookingId?: number) => {
  const response = await api.post('/payments/create-intent', { programId, bookingId });
  return response.data;
};

export const createCheckoutSession = async (programId: number) => {
  const response = await api.post('/payments/create-checkout', { programId });
  return response.data;
};

// Materials API
export const getProgramMaterials = async (programId: number) => {
  const response = await api.get(`/materials/program/${programId}`);
  return response.data;
};

export const downloadMaterial = async (materialId: number) => {
  const response = await api.get(`/materials/download/${materialId}`, { responseType: 'blob' });
  return response.data;
};

// User Profile API
export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (profileData: any) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.put('/users/password', { currentPassword, newPassword });
  return response.data;
};
