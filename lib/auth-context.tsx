/**
 * Authentication Context - Static Version
 *
 * This module provides mock authentication functionality for a static site build.
 * It simulates user registration, login, logout, and session management without backend services.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from './supabase';

// Extend Window interface to include toast function
declare global {
  interface Window {
    toast?: (options: { title: string; description: string }) => void;
  }
}

/**
 * Application user model
 */
interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
}

/**
 * Authentication context interface defining available auth operations
 */
interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => void;
  githubLogin: () => void;
}

/**
 * Data required for user registration
 */
interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Mock users for static site
const MOCK_USERS: Record<string, AppUser> = {
  'admin@kidqubit.com': {
    id: 'admin-id',
    email: 'admin@kidqubit.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    profilePicture: 'https://i.pravatar.cc/150?u=admin'
  },
  'user@example.com': {
    id: 'user-id',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    profilePicture: 'https://i.pravatar.cc/150?u=john'
  }
};

/**
 * Authentication context for providing auth state and functions throughout the app
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider component
 *
 * Manages authentication state and provides auth functions to the application.
 * This is a static version that uses mock data instead of real backend services.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in (from localStorage in static version)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a static site, we'll use localStorage to simulate persistence
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('mockUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - uses mock data
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const lowerEmail = email.toLowerCase();
      
      if (MOCK_USERS[lowerEmail] && password === 'password') {
        const userData = MOCK_USERS[lowerEmail];
        setUser(userData);
        
        // Store in localStorage for persistence in static site
        if (typeof window !== 'undefined') {
          localStorage.setItem('mockUser', JSON.stringify(userData));
        }
        
        router.push('/dashboard');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - creates mock user
  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: AppUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user'
      };
      
      setUser(newUser);
      
      // Store in localStorage for persistence in static site
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockUser', JSON.stringify(newUser));
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function - clears mock user
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mockUser');
      }
      
      router.push('/');
      
      // Show toast notification if available
      if (window.toast) {
        window.toast({
          title: "Logged out successfully",
          description: "Come back soon for more adventures!",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth login functions (simplified for static site)
  const googleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use the default user for demonstration
      const userData = MOCK_USERS['user@example.com'];
      setUser(userData);
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockUser', JSON.stringify(userData));
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const githubLogin = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use the default user for demonstration
      const userData = MOCK_USERS['user@example.com'];
      setUser(userData);
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockUser', JSON.stringify(userData));
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('GitHub login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    googleLogin,
    githubLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook for accessing authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;