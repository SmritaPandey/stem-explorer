import api from './api';
import { getAllBookings } from './data';

// Dashboard API
export const getAdminDashboard = async () => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        stats: {
          totalUsers: 256,
          totalPrograms: 18,
          totalBookings: 423,
          totalRevenue: 18945.75
        },
        recentBookings: [
          {
            id: 'rb1',
            program_title: 'Robotics Workshop',
            email: 'jane.smith@example.com',
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            status: 'Confirmed'
          },
          {
            id: 'rb2',
            program_title: 'Coding Bootcamp',
            email: 'mike.jones@example.com',
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            status: 'Pending'
          }
        ],
        upcomingPrograms: [
          {
            id: 'up1',
            title: 'Science Exploration',
            date: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
            time: '1:00 PM - 3:00 PM',
            seats: 16,
            booked_seats: 9
          },
          {
            id: 'up2',
            title: 'Math Challenge',
            date: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
            time: '3:00 PM - 5:00 PM',
            seats: 12,
            booked_seats: 5
          }
        ]
      }
    };
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return {
      success: false,
      error: 'Failed to fetch admin dashboard data'
    };
  }
};

// Users API
export const getUsers = async (params?: any) => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      data: {
        users: [
          {
            id: 'u1',
            email: 'john.doe@example.com',
            first_name: 'John',
            last_name: 'Doe',
            role: 'user',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 'u2',
            email: 'jane.smith@example.com',
            first_name: 'Jane',
            last_name: 'Smith',
            role: 'user',
            created_at: '2024-02-20T14:15:00Z'
          },
          {
            id: 'a1',
            email: 'admin@kidqubit.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            created_at: '2024-01-01T08:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalUsers: 3,
          totalPages: 1
        }
      }
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: 'Failed to fetch users'
    };
  }
};

// Get user details
export const getUser = async (userId: string | number) => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: {
        user: {
          id: userId,
          email: 'john.doe@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'user',
          bio: 'A young STEM enthusiast',
          age: 12,
          grade: '7',
          interests: ['robotics', 'coding', 'science'],
          profile_picture: 'https://i.pravatar.cc/150?u=john',
          created_at: '2024-01-15T10:30:00Z'
        },
        bookings: [
          {
            id: 'b1',
            status: 'Confirmed',
            created_at: '2024-05-01T09:45:00Z',
            program_id: '1',
            program_title: 'Robotics Workshop',
            date: '2025-06-15',
            price: '$49.99'
          }
        ]
      }
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return {
      success: false,
      error: 'Failed to fetch user details'
    };
  }
};

// Programs API (Admin specific)
export const createProgram = async (programData: any) => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      id: `p${Date.now()}`,
      ...programData,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

// Bookings API (Admin specific)
export const getAdminBookings = async (params?: any) => {
  try {
    const bookings = await getAllBookings(params);
    
    return {
      success: true,
      data: {
        bookings,
        pagination: {
          page: 1,
          limit: 10,
          totalBookings: bookings.length,
          totalPages: 1
        }
      }
    };
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return {
      success: false,
      error: 'Failed to fetch bookings'
    };
  }
};

// Analytics API
export const getRevenueAnalytics = async () => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        revenueByMonth: [
          { month: '2024-01-01', revenue: 2345.75 },
          { month: '2024-02-01', revenue: 2890.50 },
          { month: '2024-03-01', revenue: 3450.25 },
          { month: '2024-04-01', revenue: 3980.75 },
          { month: '2024-05-01', revenue: 4250.50 },
          { month: '2024-06-01', revenue: 2028.00 }
        ],
        revenueByCategory: [
          { category: 'Engineering', revenue: 6789.25, count: 142 },
          { category: 'Computer Science', revenue: 5450.50, count: 128 },
          { category: 'Science', revenue: 4230.00, count: 95 },
          { category: 'Mathematics', revenue: 2476.00, count: 58 }
        ]
      }
    };
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return {
      success: false,
      error: 'Failed to fetch revenue analytics'
    };
  }
};

export const getProgramAnalytics = async () => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      data: {
        popularPrograms: [
          { id: '1', title: 'Robotics Workshop', category: 'Engineering', price: '$49.99', booking_count: 85 },
          { id: '2', title: 'Coding Bootcamp', category: 'Computer Science', price: '$39.99', booking_count: 72 },
          { id: '3', title: 'Science Exploration', category: 'Science', price: '$45.99', booking_count: 68 }
        ],
        bookingsByCategory: [
          { category: 'Engineering', booking_count: 142 },
          { category: 'Computer Science', booking_count: 128 },
          { category: 'Science', booking_count: 95 },
          { category: 'Mathematics', booking_count: 58 }
        ]
      }
    };
  } catch (error) {
    console.error('Error fetching program analytics:', error);
    return {
      success: false,
      error: 'Failed to fetch program analytics'
    };
  }
};

export const getUserAnalytics = async () => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 450));
    
    return {
      success: true,
      data: {
        usersByMonth: [
          { month: '2024-01-01', user_count: 35 },
          { month: '2024-02-01', user_count: 42 },
          { month: '2024-03-01', user_count: 51 },
          { month: '2024-04-01', user_count: 48 },
          { month: '2024-05-01', user_count: 62 },
          { month: '2024-06-01', user_count: 18 }
        ],
        usersByAge: [
          { age_group: 'Under 10', user_count: 78 },
          { age_group: '10-12', user_count: 95 },
          { age_group: '13-15', user_count: 67 },
          { age_group: 'Over 15', user_count: 16 }
        ]
      }
    };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return {
      success: false,
      error: 'Failed to fetch user analytics'
    };
  }
};

// Materials API
export const createMaterialMetadata = async (materialMetadata: any) => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      id: `m${Date.now()}`,
      ...materialMetadata,
      file_url: '/sample-materials/sample.pdf',
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating material metadata:', error);
    throw error;
  }
};

export const getMaterialDownloadUrl = async (materialId: number): Promise<{ downloadUrl: string, fileName: string } | null> => {
  try {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      downloadUrl: '/sample-materials/sample.pdf',
      fileName: 'sample.pdf'
    };
  } catch (error) {
    console.error("Error fetching material download URL:", error);
    return null;
  }
};