import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin'; // Using admin client for DB operations

// Zod schema for creating a new program session
// Based on sessionSchema from original backend/src/routes/programs.ts
const sessionCreateSchema = z.object({
  programId: z.string().uuid("Invalid Program ID format"), // Assuming program_id in your sessions table refers to a UUID in programs table
  startTime: z.string().datetime({ message: "Invalid start time format" }),
  endTime: z.string().datetime({ message: "Invalid end time format" }),
  // Add other session-specific fields if any, e.g., current_capacity, max_capacity (if not on program)
  // For now, keeping it simple as per original Express route.
});

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = sessionCreateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const sessionData = validation.data;

  // Prepare data for Supabase insertion
  const dbSessionData = {
    program_id: sessionData.programId, // Ensure this matches your DB column name
    start_time: sessionData.startTime, // Ensure this matches your DB column name
    end_time: sessionData.endTime,     // Ensure this matches your DB column name
    // current_capacity: 0, // Default if applicable
  };

  try {
    // First, verify the program_id exists in the 'programs' table
    const { data: programExists, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('id', dbSessionData.program_id)
      .maybeSingle();

    if (programError) {
      console.error('Error checking program existence:', programError);
      return NextResponse.json({ error: 'Failed to verify program', details: programError.message }, { status: 500 });
    }

    if (!programExists) {
      return NextResponse.json({ error: 'Program not found for the given programId' }, { status: 404 });
    }
    
    // Now, insert the session
    const { data, error } = await supabaseAdmin
      .from('program_sessions') // Ensure 'program_sessions' is your table name
      .insert(dbSessionData)
      .select() // Return the created record
      .single(); // Expect a single record to be created

    if (error) {
      console.error('Error creating program session:', error);
      return NextResponse.json({ error: 'Failed to create program session', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 }); // 201 Created

  } catch (e: any) {
    console.error('Unexpected error in POST /api/admin/programs/sessions:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
