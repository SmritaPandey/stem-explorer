import { supabase } from './supabase' // For getProgramSessions
import api from './api'; // For API calls to Next.js routes
import type { LucideIcon } from 'lucide-react'; // Still used by some frontend components not in this scope

// --- CORE PROGRAM TYPE (remains mostly unchanged, defined in previous tasks) ---
export type Program = {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  date: string; // This might be deprecated if all scheduling is via sessions
  time: string;  // This might be deprecated
  location?: string | null;
  instructor?: string | null;
  seats: number; // This might represent total potential seats, session capacity is key
  price: string;
  icon?: string | null;
  age_group?: string | null;
  format?: string | null;
  requirements?: string[] | null;
  topics?: string[] | null;
  long_description?: string | null;
};

// --- PROGRAM SESSIONS ---
// For fetching sessions related to a program
export type ProgramSession = {
  id: string; // UUID
  program_id: number;
  start_time: string; // ISO datetime string
  end_time: string;   // ISO datetime string
  current_capacity: number;
  max_capacity: number; // This might be on the program itself or duplicated on session
  is_cancelled: boolean;
  // Potentially other session-specific details like instructor_id if it varies per session
  programs?: { max_capacity: number }; // Nested program to get max_capacity if not on session
};


// --- BOOKING TYPES (Updated for session-based booking API) ---
export type ProgramForBooking = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  icon?: string | null;
  image_url?: string | null;
};

export type SessionForBooking = {
  id: string; // UUID from program_sessions
  start_time: string;
  end_time: string;
  is_cancelled?: boolean;
};

export type Booking = {
  id: number; // Booking ID
  user_id: string; // From auth
  // program_id: number; // No longer top-level, it's via program_sessions
  // program_title: string; // No longer top-level
  status: "Confirmed" | "Pending" | "Cancelled" | "completed" | "Failed"; // Ensure all statuses
  payment_status?: string | null; // e.g., 'paid', 'pending', 'refunded'
  amount_paid?: number | null;
  booking_date?: string | null; // This is likely the created_at of the booking record
  created_at?: string | null;
  program: ProgramForBooking; // Nested program object
  session: SessionForBooking; // Nested session object
  // Removed: date, time, location, icon (now nested or part of session/program)
};

// Type for data needed to create a booking via API
export type NewBookingData = {
  program_session_id: string; // UUID of the program_session
  paymentStatus?: 'pending' | 'paid' | 'refunded'; // Align with API expectation
  amountPaid?: number;
};

// Filter options for programs (remains unchanged)
export type FilterOptions = {
  search?: string;
  category?: string;
  level?: string;
  ageGroup?: string;
  format?: string;
};

// --- PROGRAM FUNCTIONS (Remain largely unchanged, direct Supabase calls for now) ---
export async function getPrograms(options?: FilterOptions): Promise<Program[]> {
  try {
    let query = supabase.from('programs').select(`
      id, title, description, category, level, duration, date, time, location, instructor, seats, price, icon, age_group, format, requirements, topics, long_description
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

    const { data, error } = await query.order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching programs from Supabase:', error);
    return [];
  }
}

export async function getProgramById(id: number): Promise<Program | null> {
  if (isNaN(id)) {
    console.error('Invalid ID provided to getProgramById:', id);
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        id, title, description, category, level, duration, date, time, location, instructor, seats, price, icon, age_group, format, requirements, topics, long_description
      `)
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching program by ID from Supabase:', error);
    return null;
  }
}

// NEW: Function to get sessions for a specific program
export async function getProgramSessions(programId: number): Promise<ProgramSession[]> {
  if (isNaN(programId)) {
    console.error('Invalid program ID provided to getProgramSessions:', programId);
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('program_sessions')
      .select(`
        id, 
        program_id, 
        start_time, 
        end_time, 
        current_capacity, 
        is_cancelled,
        programs ( max_capacity ) /* Fetch max_capacity from parent program */
      `)
      .eq('program_id', programId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error(`Error fetching sessions for program ${programId}:`, error);
      throw error;
    }
    // Map to ensure max_capacity is at the session level for easier use, or adjust component
    return (data || []).map(s => ({ ...s, max_capacity: s.programs?.max_capacity || 0 }));
  } catch (error) {
    console.error('An unexpected error occurred in getProgramSessions:', error);
    return [];
  }
}

// --- MATERIAL FUNCTIONS (User-facing) ---

export interface Material {
  id: number;
  program_id: number;
  title: string;
  description?: string | null;
  file_url: string; // Public URL from Supabase Storage (or could be a path to trigger download via API)
  storage_path: string; // Path in the bucket, for admin or direct reference
  file_name: string;
  file_type: string; // MIME type
  file_size: number; // In bytes
  is_public: boolean;
  created_at: string;
  updated_at?: string | null;
  // uploaded_by?: string; // If you track this
}

export async function getMaterialsForProgram(programId: number | string): Promise<Material[]> {
  try {
    // Uses the Next.js API route which handles access logic
    const response = await api.get(`/api/materials/program/${programId}`);
    return response.data as Material[];
  } catch (error: any) {
    console.error(`Error fetching materials for program ${programId} from API:`, error.response?.data || error.message);
    return [];
  }
}

export async function getMaterialDownloadUrlClient(materialId: number): Promise<{ downloadUrl: string, fileName: string } | null> {
  try {
    // Uses the Next.js API route which handles access logic and generates signed URL
    const response = await api.get(`/api/materials/download/${materialId}`);
    return response.data; // Expects { downloadUrl: '...', fileName: '...' }
  } catch (error: any) {
    console.error(`Error fetching download URL for material ${materialId} from API:`, error.response?.data || error.message);
    return null;
  }
}

// --- PAYMENT FUNCTIONS (New - to call Next.js Payment API Routes) ---
export interface StripeCheckoutSessionResponse {
  sessionId: string;
  url: string;
  bookingId: number; // Include bookingId for reference if needed on client before redirect
}

export async function createStripeCheckoutSession(
  programId: number,
  programSessionId: string | null // Allow null if booking at program level without specific session initially
): Promise<StripeCheckoutSessionResponse> {
  if (!programId) {
    throw new Error("Program ID is required to create a Stripe Checkout session.");
  }
  // programSessionId can be null if the checkout is for a program without pre-selecting a session,
  // though current flow implies session is selected.
  
  const payload: { programId: number; programSessionId?: string } = { programId };
  if (programSessionId) {
    payload.programSessionId = programSessionId;
  }

  try {
    const response = await api.post('/api/payments/create-checkout', payload);
    // Ensure the response.data matches StripeCheckoutSessionResponse structure
    if (!response.data?.data?.sessionId || !response.data?.data?.url) {
        console.error("API response for create-checkout missing sessionId or url", response.data);
        throw new Error("Failed to create checkout session: Invalid API response.");
    }
    return response.data.data as StripeCheckoutSessionResponse;
  } catch (error: any) {
    console.error('Error creating Stripe Checkout session via API:', error.response?.data || error.message);
    throw error; // Re-throw to be caught by UI for user feedback
  }
}


// --- BOOKING FUNCTIONS (Refactored to use Next.js API Routes) ---

export type BookingFilterOptions = {
  search?: string;
  status?: Booking['status'] | 'all'; // Use Booking['status'] type
  // dateRange could be added later if needed
};

// Get bookings for a specific user
export async function getBookingsForUser(options?: BookingFilterOptions): Promise<Booking[]> {
  // userId is now handled by the API route via authentication context
  try {
    const response = await api.get('/api/bookings', { params: options });
    return response.data as Booking[]; // Assume API returns data in correct Booking[] format
  } catch (error: any) {
    console.error('Error fetching bookings for user from API:', error.response?.data || error.message);
    // throw error; // Or return empty array / handle differently
    return [];
  }
}

// Get all bookings (for admin)
// This function now calls the /api/admin/bookings route
export async function getAllBookings(options?: BookingFilterOptions): Promise<Booking[]> {
  try {
    // Admin routes use different base path, ensure api client handles this or use separate one.
    // For now, assuming api client is fine.
    const response = await api.get('/api/admin/bookings', { params: options });
    return response.data.data.bookings as Booking[]; // Adjust based on actual admin API response structure
  } catch (error: any) {
    console.error('Error fetching all bookings from API:', error.response?.data || error.message);
    return [];
  }
}

// Create a new booking
export async function createBooking(bookingData: NewBookingData): Promise<Booking | null> {
  if (!bookingData.program_session_id) {
    console.error("Program Session ID is required to create a booking.");
    return null;
  }
  try {
    const response = await api.post('/api/bookings', bookingData);
    return response.data as Booking; // Assume API returns the created booking in correct format
  } catch (error: any) {
    console.error('Error creating booking via API:', error.response?.data || error.message);
    throw error; // Re-throw to be caught by UI for user feedback
    // return null;
  }
}

// Cancel a booking
export async function cancelBooking(bookingId: number): Promise<boolean> {
  if (isNaN(bookingId)) {
    console.error('Invalid booking ID provided for cancellation.');
    return false;
  }
  try {
    await api.put(`/api/bookings/${bookingId}/cancel`);
    return true;
  } catch (error: any) {
    console.error('Error cancelling booking via API:', error.response?.data || error.message);
    return false;
  }
}
