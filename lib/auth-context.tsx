/**
 * Authentication Context
 *
 * This module provides authentication functionality using Supabase Auth.
 * It handles user registration, login, logout, and session management.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import supabase from './supabase';

// Extend Window interface to include toast function
declare global {
  interface Window {
    toast?: (options: { title: string; description: string }) => void;
  }
}

/**
 * Application user model that combines Supabase Auth user with profile data
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

/**
 * Authentication context for providing auth state and functions throughout the app
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider component
 *
 * Manages authentication state and provides auth functions to the application.
 * Handles session persistence, user profile management, and auth state changes.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get the current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Get user profile data
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userData: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: profile.first_name,
              lastName: profile.last_name,
              role: profile.role || 'user',
              profilePicture: profile.profile_picture
            };

            setUser(userData);
          } else {
            // If no profile exists but user is authenticated, create a basic profile
            const userData: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.first_name || '',
              lastName: session.user.user_metadata?.last_name || '',
              role: session.user.user_metadata?.role || 'user'
            };

            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Get user profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userData: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: profile.first_name,
              lastName: profile.last_name,
              role: profile.role || 'user',
              profilePicture: profile.profile_picture
            };

            setUser(userData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const userData: AppUser = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: profile.role || 'user',
            profilePicture: profile.profile_picture
          };

          setUser(userData);
        }

        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile in the profiles table
        await supabase.from('profiles').insert({
          id: data.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          role: 'user'
        });

        const newUser: AppUser = {
          id: data.user.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'user'
        };

        setUser(newUser);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);

      // Redirect to homepage after logout
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

  // OAuth login functions
  const googleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const githubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
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
 *
 * Provides access to the current user, authentication state, and auth functions.
 * Must be used within an AuthProvider component.
 *
 * @returns The authentication context
 * @throws Error if used outside of an AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
