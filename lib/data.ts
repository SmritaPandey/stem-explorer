/**
 * Data types and API functions for the Kid Qubit platform
 */

import { supabase } from './supabase';
import api from './api';
import type { LucideIcon } from 'lucide-react';

// Core Program Type
export type Program = {
  id: string; // UUID
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  date: string;
  time: string;
  location?: string | null;
  instructor?: string | null;
  seats: number;
  price: string;
  icon?: string | null;
  age_group?: string | null;
  format?: string | null;
  requirements?: string[] | null;
  topics?: string[] | null;
  long_description?: string | null;
};

// Program Session Type
export type ProgramSession = {
  id: string; // UUID
  program_id: string; // UUID
  start_time: string;
  end_time: string;
  current_capacity: number;
  max_capacity: number;
  is_cancelled: boolean;
  programs?: { max_capacity: number };
};

// Booking Types
export type ProgramForBooking = {
  id: string; // UUID
  title: string;
  description?: string | null;
  location?: string | null;
  icon?: string | null;
  image_url?: string | null;
};

export type SessionForBooking = {
  id: string; // UUID
  start_time: string;
  end_time: string;
  is_cancelled?: boolean;
};

export type Booking = {
  id: string; // UUID
  user_id: string; // UUID
  status: "Confirmed" | "Pending" | "Cancelled" | "completed" | "Failed";
  payment_status?: string | null;
  amount_paid?: number | null;
  booking_date?: string | null;
  created_at?: string | null;
  program: ProgramForBooking;
  session: SessionForBooking;
};

// Filter Options
export type FilterOptions = {
  search?: string;
  category?: string;
  level?: string;
  ageGroup?: string;
  format?: string;
};

// Program Functions
export async function getPrograms(options?: FilterOptions): Promise<Program[]> {
  try {
    let query = supabase.from('programs').select(`
      id, title, description, category, level, duration, date, time, location, 
      instructor, seats, price, icon, age_group, format, requirements, topics, 
      long_description
    `);

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }
    if (options?.category && options.category !== "all") {
      query = query.eq('category', options.category);
    }
    if (options?.level && options.level !== "all") {
      query = query.eq('level', options.level);
    }
    if (options?.ageGroup && options.ageGroup !== "all") {
      query = query.ilike('age_group', `%${options.ageGroup}%`);
    }
    if (options?.format && options.format !== "all") {
      query = query.eq('format', options.format);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

export async function getProgramById(id: string): Promise<Program | null> {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        id, title, description, category, level, duration, date, time, location,
        instructor, seats, price, icon, age_group, format, requirements, topics,
        long_description
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching program:', error);
    return null;
  }
}

export async function getProgramSessions(programId: string): Promise<ProgramSession[]> {
  try {
    const { data, error } = await supabase
      .from('program_sessions')
      .select(`
        id, program_id, start_time, end_time, current_capacity, is_cancelled,
        programs (max_capacity)
      `)
      .eq('program_id', programId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      max_capacity: s.programs?.max_capacity || 0
    }));
  } catch (error) {
    console.error('Error fetching program sessions:', error);
    return [];
  }
}

// Material Types and Functions
export interface Material {
  id: string; // UUID
  program_id: string; // UUID
  title: string;
  description?: string | null;
  file_url: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string | null;
}

export async function getMaterialsForProgram(programId: string): Promise<Material[]> {
  try {
    const response = await api.get(`/api/materials/program/${programId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
}

export async function getMaterialDownloadUrlClient(materialId: string): Promise<{ downloadUrl: string, fileName: string } | null> {
  try {
    const response = await api.get(`/api/materials/download/${materialId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting download URL:', error);
    return null;
  }
}

// Payment Types and Functions
export interface StripeCheckoutSessionResponse {
  sessionId: string;
  url: string;
  bookingId: string; // UUID
}

export async function createStripeCheckoutSession(
  programId: string,
  programSessionId: string | null
): Promise<StripeCheckoutSessionResponse> {
  if (!programId) {
    throw new Error("Program ID is required");
  }

  try {
    const response = await api.post('/api/payments/create-checkout', {
      programId,
      programSessionId
    });

    if (!response.data?.data?.sessionId || !response.data?.data?.url) {
      throw new Error("Invalid checkout session response");
    }

    return response.data.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Booking Functions
export type BookingFilterOptions = {
  search?: string;
  status?: Booking['status'] | 'all';
};

export async function getBookingsForUser(options?: BookingFilterOptions): Promise<Booking[]> {
  try {
    const response = await api.get('/api/bookings', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
}

export async function getAllBookings(options?: BookingFilterOptions): Promise<Booking[]> {
  try {
    const response = await api.get('/api/admin/bookings', { params: options });
    return response.data.data.bookings;
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    return [];
  }
}

export async function createBooking(bookingData: {
  program_session_id: string;
  paymentStatus?: string;
  amountPaid?: number;
}): Promise<Booking | null> {
  try {
    const response = await api.post('/api/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  try {
    await api.put(`/api/bookings/${bookingId}/cancel`);
    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
}