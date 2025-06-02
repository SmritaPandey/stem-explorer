import api from './api';
import { getAllBookings, getPrograms as getStaticPrograms, getProgramById, getUserProfile as getMockUserProfile } from './data';

// Programs API
export const getPrograms = async (params?: any) => {
  try {
    const data = await getStaticPrograms(params);
    
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching programs:', error);
    return {
      success: false,
      error: 'Failed to fetch programs'
    };
  }
};

export const getProgram = async (id: string) => {
  try {
    const program = await getProgramById(id);
    
    if (!program) {
      return {
        success: false,
        error: 'Program not found'
      };
    }
    
    return {
      success: true,
      data: program
    };
  } catch (error) {
    console.error('Error fetching program:', error);
    return {
      success: false,
      error: 'Failed to fetch program'
    };
  }
};

// Bookings API
export const getBookings = async () => {
  try {
    const response = await api.get('/api/bookings');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return {
      success: false,
      error: 'Failed to fetch bookings'
    };
  }
};

export const cancelBooking = async (bookingId: number | string) => {
  try {
    await api.put(`/api/bookings/${bookingId}/cancel`);
    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
};

// User Profile API
export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/users/profile');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      success: false,
      error: 'Failed to fetch user profile'
    };
  }
};

export const updateUserProfile = async (profileData: any) => {
  try {
    const response = await api.put('/api/users/profile', profileData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Failed to update user profile'
    };
  }
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  try {
    await api.put('/api/users/password', { newPassword });
    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      error: 'Failed to update password'
    };
  }
};