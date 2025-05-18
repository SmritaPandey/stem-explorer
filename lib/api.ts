/**
 * API Client Configuration
 *
 * This file initializes and exports an axios instance for making API requests to the backend.
 * It's primarily used for endpoints not directly handled by Supabase.
 *
 * Note: Most data operations now use Supabase directly, but this client is kept
 * for compatibility with any remaining backend API endpoints.
 */

import axios from 'axios';
import supabase from './supabase';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Get the current session from Supabase
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      // If token exists, add it to the request headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?error=Your session has expired. Please log in again.';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
