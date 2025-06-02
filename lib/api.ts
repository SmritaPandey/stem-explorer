/**
 * API Client - Static Site Version
 *
 * This file provides a mock API client for static site generation.
 * It simulates API calls without requiring actual backend connections.
 */

import axios from 'axios';

// Create a mock axios instance
const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock responses for API calls
const MOCK_RESPONSES: Record<string, any> = {
  // User profile
  '/api/users/profile': {
    id: 'user-id',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-123-4567',
    role: 'user',
    profilePicture: 'https://i.pravatar.cc/150?u=john',
  },
  
  // Bookings
  '/api/bookings': [
    {
      id: 'b1',
      status: 'Confirmed',
      payment_status: 'paid',
      amount_paid: 49.99,
      program: {
        id: '1',
        title: 'Robotics Workshop',
        location: 'STEM Innovation Center',
        icon: 'Rocket'
      },
      session: {
        id: 's1',
        start_time: '2025-06-15T10:00:00Z',
        end_time: '2025-06-15T12:00:00Z'
      }
    },
    {
      id: 'b2',
      status: 'Pending',
      payment_status: 'pending',
      amount_paid: 39.99,
      program: {
        id: '2',
        title: 'Coding Bootcamp',
        location: 'Tech Hub, Room 101',
        icon: 'Code'
      },
      session: {
        id: 's3',
        start_time: '2025-06-20T14:00:00Z',
        end_time: '2025-06-20T17:00:00Z'
      }
    }
  ],
  
  // Program materials
  '/api/materials/program/1': [
    {
      id: 'm1',
      program_id: '1',
      title: 'Robotics Workshop Guide',
      description: 'Complete guide with diagrams and instructions',
      file_url: '/sample-materials/robotics-guide.pdf',
      storage_path: 'robotics-guide.pdf',
      file_name: 'robotics-guide.pdf',
      file_type: 'application/pdf',
      file_size: 2500000,
      is_public: true,
      created_at: '2025-05-15T10:00:00Z'
    }
  ],
  
  // Checkout session
  '/api/payments/create-checkout': {
    success: true,
    data: {
      sessionId: 'mock_session_id',
      url: '/dashboard/bookings/success?booking_id=mock123',
      bookingId: 'mock123'
    }
  }
};

// Add request interceptor to simulate API responses
api.interceptors.request.use(
  async (config) => {
    // Simulate authentication header
    config.headers.Authorization = 'Bearer mock-token';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Override axios methods to return mock responses
const originalGet = api.get;
api.get = async function(url, config) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Check if we have a mock response for this URL
  const baseUrl = url.split('?')[0]; // Remove query parameters
  
  // Handle paths with IDs
  if (baseUrl.includes('/api/materials/program/')) {
    const programId = baseUrl.split('/').pop();
    return { data: MOCK_RESPONSES['/api/materials/program/1'] };
  }
  
  if (baseUrl.includes('/api/materials/download/')) {
    return {
      data: {
        downloadUrl: '/sample-materials/robotics-guide.pdf',
        fileName: 'robotics-guide.pdf'
      }
    };
  }
  
  if (MOCK_RESPONSES[baseUrl]) {
    return { data: MOCK_RESPONSES[baseUrl] };
  }
  
  // Fall back to mock for unknown endpoints
  console.warn(`No mock response for ${url}, returning empty data`);
  return { data: {} };
};

const originalPost = api.post;
api.post = async function(url, data, config) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if we have a mock response for this URL
  if (url === '/api/payments/create-checkout') {
    return { data: MOCK_RESPONSES[url] };
  }
  
  if (url === '/api/bookings') {
    return {
      data: {
        id: `mock${Date.now()}`,
        status: 'Confirmed',
        program: {
          title: 'Mock Program',
          location: 'Mock Location'
        },
        session: {
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7200000).toISOString()
        }
      }
    };
  }
  
  // Fall back to generic success response
  return { data: { success: true } };
};

const originalPut = api.put;
api.put = async function(url, data, config) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Fall back to generic success response
  return { data: { success: true } };
};

export default api;