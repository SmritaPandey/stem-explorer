import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin'; // Using admin client for DB operations

// Zod schema for profile updates
const profileUpdateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  phone: z.string().optional().nullable(), // Allow null to clear phone
  profilePicture: z.string().url("Invalid URL format for profile picture").optional().nullable(),
  // Add other fields as needed, e.g., bio, interests
});

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); // Should be caught by errorResponse

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile', details: error.message }, { status: 500 });
    }

    // Format for frontend (optional, but good practice)
    const profileData = {
      id: data.id,
      email: data.email, // Email usually comes from auth.users, ensure it's in profiles or join
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      role: data.role, // Assuming role is in profiles table, otherwise from user.role
      profilePicture: data.profile_picture,
      createdAt: data.created_at,
      // Map other fields as necessary
    };
    return NextResponse.json(profileData);

  } catch (e: any) {
    console.error('Unexpected error in GET /api/users/profile:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = profileUpdateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const updates = validation.data;
  const dbUpdates: Record<string, any> = {};

  // Map camelCase to snake_case and only include fields that are present
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone; // Handles null for clearing
  if (updates.profilePicture !== undefined) dbUpdates.profile_picture = updates.profilePicture; // Handles null

  if (Object.keys(dbUpdates).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
  }
  
  dbUpdates.updated_at = new Date().toISOString(); // Add updated_at timestamp

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id)
      .select('id, email, first_name, last_name, phone, role, profile_picture, created_at, updated_at') // Select desired fields
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
    }
    
    // Format for frontend
    const profileData = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      role: data.role,
      profilePicture: data.profile_picture,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(profileData);

  } catch (e: any) {
    console.error('Unexpected error in PUT /api/users/profile:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
