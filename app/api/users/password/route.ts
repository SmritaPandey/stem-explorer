import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin'; // Using admin client for user updates

// Zod schema for password updates
const passwordUpdateSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  // currentPassword: z.string().optional(), // Not used with admin client for direct user update
});

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

  const validation = passwordUpdateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { newPassword } = validation.data;

  try {
    // Use the admin client to update the user's password by their ID
    // This is generally safer and more appropriate for backend route handlers.
    // The user's identity has been verified by `authenticateRoute`.
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating user password:', updateError);
      // Provide a more generic error message to the client for security
      return NextResponse.json({ error: 'Failed to update password', details: updateError.message }, { status: 500 });
    }

    // Supabase doesn't return the user object on password update via admin typically,
    // but a success response is sufficient.
    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (e: any) {
    console.error('Unexpected error in PUT /api/users/password:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
