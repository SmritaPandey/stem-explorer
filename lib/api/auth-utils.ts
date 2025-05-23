import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Using the frontend client for getUser
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string; // Role should be in user_metadata
  // Add any other user properties you need from the JWT/user object
}

export async function authenticateRoute(
  request: NextRequest
): Promise<{ user: AuthenticatedUser | null; errorResponse: NextResponse | null }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 }),
    };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized: Token not found' }, { status: 401 }),
    };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    console.error('Token validation error:', error?.message);
    return {
      user: null,
      errorResponse: NextResponse.json({ error: `Unauthorized: ${error?.message || 'Invalid token'}` }, { status: 401 }),
    };
  }

  // Ensure user object and email are present
  if (!data.user.email) {
    console.error('Authenticated user has no email:', data.user.id);
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Internal Server Error: User email missing' }, { status: 500 }),
    };
  }
  
  const appUser: AuthenticatedUser = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || 'user', // Default to 'user' if no role
  };

  return { user: appUser, errorResponse: null };
}

export function requireAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin';
}
