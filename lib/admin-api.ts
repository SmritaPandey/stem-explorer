import api from './api';

// Dashboard API
export const getAdminDashboard = async () => {
  const response = await api.get('/api/admin/dashboard'); 
  return response.data;
};

// Users API
export const getUsers = async (params?: any) => {
  const response = await api.get('/api/admin/users', { params }); 
  return response.data;
};

export const getUser = async (userId: string | number) => { 
  const response = await api.get(`/api/admin/users/${userId}`); 
  return response.data;
};

export const updateUser = async (userId: string | number, userData: any) => { 
  const response = await api.put(`/api/admin/users/${userId}`, userData); 
  return response.data;
};

// Programs API (Admin specific)
export const createProgram = async (programData: any) => {
  const response = await api.post('/api/admin/programs', programData); 
  return response.data;
};

export const updateProgram = async (programId: string | number, programData: any) => { 
  const response = await api.put(`/api/admin/programs/${programId}`, programData); 
  return response.data;
};

// deleteProgram was not part of the admin refactoring to Next.js API routes in the previous subtask.
// If it should be, its backend route needs to be created first. Leaving as is for now.
export const deleteProgram = async (programId: number) => {
  const response = await api.delete(`/programs/${programId}`); // Original path
  return response.data;
};

// Bookings API (Admin specific)
export const getAdminBookings = async (params?: any) => {
  const response = await api.get('/api/admin/bookings', { params }); 
  return response.data;
};

export const updateBookingStatus = async (bookingId: number, status: string) => {
  const response = await api.put(`/api/admin/bookings/${bookingId}`, { status }); 
  return response.data;
};

// --- Materials API (Updated for Next.js API Routes) ---

// For admins to list all material metadata (assumes an API route like GET /api/materials exists or will be created)
export const getAllMaterialsAdmin = async () => {
  // Assuming the GET /api/materials route will list all materials for an admin.
  // If it's paginated or filtered, params would be added here.
  const response = await api.get('/api/materials/all'); // Placeholder: Assuming a new route for "all materials" for admin
                                                     // Or, GET /api/materials could be admin-only if no other listing is needed.
                                                     // The previous task created GET /api/materials/program/[programId] and GET /api/materials/[materialId]
                                                     // There isn't a GET /api/materials route yet.
                                                     // For now, this will point to a non-existent route.
  return response.data;
};

// Creates metadata in the database after a file has been uploaded to Supabase Storage.
export const createMaterialMetadata = async (materialMetadata: {
  programId: number;
  title: string;
  description?: string;
  isPublic: boolean;
  storagePath: string; // Path from Supabase Storage upload
  fileName: string;    // Original file name
  fileType: string;    // MIME type
  fileSize: number;    // Size in bytes
}) => {
  const response = await api.post('/api/materials', materialMetadata);
  return response.data;
};

// Updates material metadata (e.g., title, description, isPublic)
export const updateMaterialMetadata = async (materialId: number, materialData: {
  title?: string;
  description?: string;
  isPublic?: boolean;
}) => {
  const response = await api.put(`/api/materials/${materialId}`, materialData);
  return response.data;
};

// Deletes material metadata from DB and the file from Supabase Storage (via the backend API route)
export const deleteMaterialAdmin = async (materialId: number) => {
  const response = await api.delete(`/api/materials/${materialId}`);
  return response.data;
};

// Gets a temporary download URL for a material file
export const getMaterialDownloadUrl = async (materialId: number): Promise<{ downloadUrl: string, fileName: string } | null> => {
  try {
    const response = await api.get(`/api/materials/download/${materialId}`);
    return response.data; // Expects { downloadUrl: '...', fileName: '...' }
  } catch (error) {
    console.error("Error fetching material download URL:", error);
    return null;
  }
};

// Analytics API
export const getRevenueAnalytics = async () => {
  const response = await api.get('/api/admin/analytics/revenue'); 
  return response.data;
};

export const getProgramAnalytics = async () => {
  const response = await api.get('/api/admin/analytics/programs'); 
  return response.data;
};

export const getUserAnalytics = async () => {
  const response = await api.get('/api/admin/analytics/users'); 
  return response.data;
};
