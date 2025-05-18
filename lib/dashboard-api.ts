import api from './api';
import supabase from './supabase';

// Programs API
export const getPrograms = async (params?: any) => {
  try {
    // Use Supabase directly instead of the backend API
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

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
    // Get the program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();

    if (programError) throw programError;

    // Get the program sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('program_sessions')
      .select('*')
      .eq('program_id', id)
      .order('start_time', { ascending: true });

    if (sessionsError) throw sessionsError;

    return {
      success: true,
      data: {
        ...program,
        sessions: sessions || []
      }
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
    // Use Supabase directly instead of the backend API
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        program_sessions!inner (
          *,
          programs!inner (*)
        )
      `)
      .order('booking_date', { ascending: false });

    if (error) throw error;

    // Format the data for the frontend
    const formattedBookings = data.map(booking => ({
      id: booking.id,
      status: booking.status,
      program_title: booking.program_sessions.programs.title,
      program_date: booking.program_sessions.start_time,
      program_time: new Date(booking.program_sessions.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: booking.program_sessions.programs.location
    }));

    return {
      success: true,
      data: formattedBookings
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return {
      success: false,
      error: 'Failed to fetch bookings'
    };
  }
};

export const createBooking = async (sessionId: string, paymentStatus: string = 'pending', amountPaid: number) => {
  try {
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    // Create the booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: session.user.id,
        session_id: sessionId,
        status: 'confirmed',
        payment_status: paymentStatus,
        amount_paid: amountPaid
      })
      .select()
      .single();

    if (error) throw error;

    // Update the session capacity
    const { data: sessionData } = await supabase
      .from('program_sessions')
      .select('current_capacity')
      .eq('id', sessionId)
      .single();

    await supabase
      .from('program_sessions')
      .update({ current_capacity: (sessionData?.current_capacity || 0) + 1 })
      .eq('id', sessionId);

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      error: 'Failed to create booking'
    };
  }
};

export const cancelBooking = async (bookingId: string) => {
  try {
    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Update session capacity
    const { data: session } = await supabase
      .from('program_sessions')
      .select('current_capacity')
      .eq('id', booking.session_id)
      .single();

    await supabase
      .from('program_sessions')
      .update({
        current_capacity: Math.max(0, (session?.current_capacity || 1) - 1)
      })
      .eq('id', booking.session_id);

    return {
      success: true
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error: 'Failed to cancel booking'
    };
  }
};

// Payments API
export const createPaymentIntent = async (programId: string, bookingId?: string) => {
  try {
    // For now, just return a mock payment intent
    return {
      success: true,
      data: {
        clientSecret: 'mock_client_secret',
        amount: 4999
      }
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: 'Failed to create payment intent'
    };
  }
};

export const createCheckoutSession = async (programId: string) => {
  try {
    // For now, just return a mock checkout session
    return {
      success: true,
      data: {
        url: 'https://checkout.stripe.com/mock-session'
      }
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: 'Failed to create checkout session'
    };
  }
};

// Materials API
export const getProgramMaterials = async (programId: string) => {
  try {
    // For now, just return mock materials
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Course Syllabus',
          description: 'Overview of the course content and schedule',
          fileType: 'pdf',
          fileSize: '1.2 MB',
          downloadUrl: '#'
        },
        {
          id: '2',
          title: 'Preparation Materials',
          description: 'Materials to review before the first class',
          fileType: 'pdf',
          fileSize: '2.5 MB',
          downloadUrl: '#'
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching program materials:', error);
    return {
      success: false,
      error: 'Failed to fetch program materials'
    };
  }
};

export const downloadMaterial = async (materialId: string) => {
  try {
    // For now, just return a mock blob
    return {
      success: true,
      data: new Blob(['Mock file content'], { type: 'application/pdf' })
    };
  } catch (error) {
    console.error('Error downloading material:', error);
    return {
      success: false,
      error: 'Failed to download material'
    };
  }
};

// User Profile API
export const getUserProfile = async () => {
  try {
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    // Get the user profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;

    // Format the response
    const profile = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      role: data.role,
      profilePicture: data.profile_picture,
      createdAt: data.created_at
    };

    return {
      success: true,
      data: profile
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
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {};
    if (profileData.firstName) dbUpdates.first_name = profileData.firstName;
    if (profileData.lastName) dbUpdates.last_name = profileData.lastName;
    if (profileData.phone) dbUpdates.phone = profileData.phone;
    if (profileData.profilePicture) dbUpdates.profile_picture = profileData.profilePicture;

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    // Format the response
    const profile = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      role: data.role,
      profilePicture: data.profile_picture,
      createdAt: data.created_at
    };

    return {
      success: true,
      data: profile
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
    // Update password using Supabase Auth API
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

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
