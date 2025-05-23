import { NextRequest, NextResponse } from 'next/server';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';

const BUCKET_NAME = 'course-materials';

// Helper function to check program access (can be shared or moved to a common util)
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
    console.error('Error checking program access for download:', error.message);
    return false;
  }
  return !!data;
}

export async function GET(request: NextRequest, { params }: { params: { materialId: string } }) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const materialId = parseInt(params.materialId, 10);
  if (isNaN(materialId)) {
    return NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 });
  }

  try {
    // 1. Fetch material metadata, including its storage_path and program_id
    const { data: material, error: materialError } = await supabaseAdmin
      .from('course_materials')
      .select('id, program_id, storage_path, file_name, is_public') // Ensure storage_path and program_id are selected
      .eq('id', materialId)
      .single();

    if (materialError) {
      if (materialError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Material not found' }, { status: 404 });
      }
      console.error(`Error fetching material ${materialId} for download:`, materialError);
      return NextResponse.json({ error: 'Failed to fetch material details', details: materialError.message }, { status: 500 });
    }

    if (!material.storage_path) {
        return NextResponse.json({ error: 'File path not found for this material' }, { status: 404 });
    }

    // 2. Access check: If material is not public and user is not admin
    if (!material.is_public && user.role !== 'admin') {
      const hasAccess = await checkProgramAccess(material.program_id, user.id);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to download this material' }, { status: 403 });
      }
    }
    // Admins or users with access (enrolled or public material) can proceed

    // 3. Generate a signed URL for download (valid for a short period, e.g., 1 hour)
    // The 'download' option in createSignedUrl prompts the browser to download with the original filename.
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(material.storage_path, 3600, { // 3600 seconds = 1 hour
        download: material.file_name || true // Use stored filename or true to force download
      }); 

    if (signedUrlError) {
      console.error(`Error creating signed URL for ${material.storage_path}:`, signedUrlError);
      return NextResponse.json({ error: 'Failed to generate download link', details: signedUrlError.message }, { status: 500 });
    }

    // 4. Return the signed URL in the JSON response
    // The client will use this URL to initiate the download.
    // Alternatively, you could issue a redirect: return NextResponse.redirect(signedUrlData.signedUrl);
    // But returning JSON gives client more control.
    return NextResponse.json({ downloadUrl: signedUrlData.signedUrl, fileName: material.file_name });

  } catch (e: any) {
    console.error('Unexpected error in GET /api/materials/download/[materialId]:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
