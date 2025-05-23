import { NextRequest, NextResponse } from 'next/server';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';

const BUCKET_NAME = 'course-materials';

// Helper function to check program access (simplified)
// In a real app, this might be more complex, checking specific enrollment statuses.
async function checkProgramAccess(programId: number, userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('program_id', programId)
    .eq('user_id', userId)
    .in('status', ['Confirmed', 'completed']) // Consider which statuses grant access
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking program access:', error.message);
    return false;
  }
  return !!data;
}

export async function GET(request: NextRequest, { params }: { params: { programId: string } }) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const programId = parseInt(params.programId, 10);
  if (isNaN(programId)) {
    return NextResponse.json({ error: 'Invalid program ID format' }, { status: 400 });
  }

  try {
    let query = supabaseAdmin
      .from('course_materials')
      .select('*')
      .eq('program_id', programId);

    // If user is not admin, apply access logic
    if (user.role !== 'admin') {
      const hasDirectAccess = await checkProgramAccess(programId, user.id);
      if (!hasDirectAccess) {
        // If no direct access (e.g., not enrolled), only show public materials
        query = query.eq('is_public', true);
      }
      // If they have direct access, they can see all materials for that program (public and private)
    }
    // Admins see all materials for the program without further checks here.

    const { data: materials, error: materialsError } = await query.order('created_at', { ascending: false });

    if (materialsError) {
      console.error(`Error fetching materials for program ${programId}:`, materialsError);
      return NextResponse.json({ error: 'Failed to fetch materials', details: materialsError.message }, { status: 500 });
    }

    return NextResponse.json(materials || []);

  } catch (e: any) {
    console.error('Unexpected error in GET /api/materials/program/[programId]:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
