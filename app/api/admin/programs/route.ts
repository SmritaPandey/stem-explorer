import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin'; // Using admin client for DB operations

// Zod schema for creating a new program
// Based on programSchema from original backend/src/routes/programs.ts
// Ensure this matches your 'programs' table structure and frontend expectations
const programCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  level: z.string().min(1, "Level is required"), // Added from lib/data.ts Program type
  duration: z.string().min(1, "Duration is required"), // Changed from number to string to match Program type
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }), // Validate as date string
  time: z.string().min(1, "Time is required"),
  location: z.string().optional().nullable(),
  instructor: z.string().optional().nullable(), // Changed from instructorId (UUID) to string for simplicity
  seats: z.number().min(0, "Seats must be a non-negative number"),
  price: z.string().min(1, "Price is required"), // Changed from number to string
  icon: z.string().optional().nullable(),
  age_group: z.string().optional().nullable(), // Using snake_case for consistency with DB
  format: z.string().optional().nullable(),
  requirements: z.array(z.string()).optional().nullable(),
  topics: z.array(z.string()).optional().nullable(),
  long_description: z.string().optional().nullable(), // Using snake_case
  // isActive: z.boolean().default(true), // Default in original, can be added if needed
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

  const validation = programCreateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const programData = validation.data;

  // Prepare data for Supabase insertion (ensure snake_case if your DB uses it)
  // The schema already uses some snake_case (age_group, long_description)
  // For others, Supabase client handles mapping if JS objects are camelCase and DB is snake_case,
  // but explicit mapping is safer.
  const dbProgramData = {
    title: programData.title,
    description: programData.description,
    category: programData.category,
    level: programData.level,
    duration: programData.duration,
    date: programData.date,
    time: programData.time,
    location: programData.location,
    instructor: programData.instructor,
    seats: programData.seats,
    price: programData.price,
    icon: programData.icon,
    age_group: programData.age_group,
    format: programData.format,
    requirements: programData.requirements,
    topics: programData.topics,
    long_description: programData.long_description,
    // is_active: programData.isActive, // if added to schema
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('programs') // Ensure 'programs' is your table name
      .insert(dbProgramData)
      .select() // Return the created record
      .single(); // Expect a single record to be created

    if (error) {
      console.error('Error creating program:', error);
      // Consider more specific error handling, e.g., for unique constraint violations
      return NextResponse.json({ error: 'Failed to create program', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 }); // 201 Created

  } catch (e: any) {
    console.error('Unexpected error in POST /api/admin/programs:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
