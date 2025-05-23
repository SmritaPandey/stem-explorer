import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin'; // Using admin client for DB operations

// Zod schema for updating an existing program (all fields optional)
// Ensure this aligns with your 'programs' table structure and frontend expectations
const programUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  category: z.string().min(1, "Category is required").optional(),
  level: z.string().min(1, "Level is required").optional(),
  duration: z.string().min(1, "Duration is required").optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }).optional(),
  time: z.string().min(1, "Time is required").optional(),
  location: z.string().nullable().optional(),
  instructor: z.string().nullable().optional(),
  seats: z.number().min(0, "Seats must be a non-negative number").optional(),
  price: z.string().min(1, "Price is required").optional(),
  icon: z.string().nullable().optional(),
  age_group: z.string().nullable().optional(),
  format: z.string().nullable().optional(),
  requirements: z.array(z.string()).nullable().optional(),
  topics: z.array(z.string()).nullable().optional(),
  long_description: z.string().nullable().optional(),
  // isActive: z.boolean().optional(), // if you have an is_active field
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  const programId = params.id;
  if (!programId) {
    return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
  }

  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = programUpdateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const updatesToApply = validation.data;

  if (Object.keys(updatesToApply).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
  }
  
  // Add updated_at timestamp if you have such a column
  // (updatesToApply as any).updated_at = new Date().toISOString();


  try {
    const { data, error } = await supabaseAdmin
      .from('programs') // Ensure 'programs' is your table name
      .update(updatesToApply)
      .eq('id', programId)
      .select() // Return the updated record
      .single(); // Expect a single record to be updated

    if (error) {
      if (error.code === 'PGRST116') { // Error code for "Not found"
        return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      }
      console.error('Error updating program:', error);
      return NextResponse.json({ error: 'Failed to update program', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (e: any) {
    console.error(`Unexpected error in PUT /api/admin/programs/${programId}:`, e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
