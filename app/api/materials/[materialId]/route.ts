import { NextRequest, NextResponse } from 'next/server';
import { authenticateRoute, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';

const BUCKET_NAME = 'course-materials';

// Helper function to check program access (simplified) - can be shared or moved to a common util
async function checkProgramAccess(programId: number, userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('program_id', programId)
    .eq('user_id', userId)
    .in('status', ['Confirmed', 'completed'])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking program access:', error.message);
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
    const { data: material, error: materialError } = await supabaseAdmin
      .from('course_materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (materialError) {
      if (materialError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Material not found' }, { status: 404 });
      }
      console.error(`Error fetching material ${materialId}:`, materialError);
      return NextResponse.json({ error: 'Failed to fetch material', details: materialError.message }, { status: 500 });
    }

    // Access check: If material is not public and user is not admin
    if (!material.is_public && user.role !== 'admin') {
      const hasAccess = await checkProgramAccess(material.program_id, user.id);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this material' }, { status: 403 });
      }
    }
    // Admins or users with access (enrolled or public material) can proceed

    return NextResponse.json(material);

  } catch (e: any) {
    console.error('Unexpected error in GET /api/materials/[materialId]:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}

import { z } from 'zod'; // Import Zod for PUT validation

// Zod schema for updating material metadata
const materialUpdateSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).optional(),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  // Note: Updating programId, or file details (storagePath, fileName, fileType, fileSize)
  // would typically involve more complex logic, potentially re-uploading or moving files.
  // For this PUT, we're focusing on editable metadata like title, description, isPublic.
});

export async function PUT(request: NextRequest, { params }: { params: { materialId: string } }) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) { // Ensure only admins can update
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  const materialId = parseInt(params.materialId, 10);
  if (isNaN(materialId)) {
    return NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 });
  }

  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = materialUpdateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const updatesToApply = validation.data;

  if (Object.keys(updatesToApply).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
  }
  
  // Prepare for DB (snake_case if needed, though Supabase client can handle camelCase)
  const dbUpdates: Record<string, any> = {};
  if (updatesToApply.title !== undefined) dbUpdates.title = updatesToApply.title;
  if (updatesToApply.description !== undefined) dbUpdates.description = updatesToApply.description;
  if (updatesToApply.isPublic !== undefined) dbUpdates.is_public = updatesToApply.isPublic;
  dbUpdates.updated_at = new Date().toISOString(); // Add updated_at timestamp

  try {
    const { data: updatedMaterial, error: updateError } = await supabaseAdmin
      .from('course_materials')
      .update(dbUpdates)
      .eq('id', materialId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Material not found' }, { status: 404 });
      }
      console.error(`Error updating material ${materialId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update material', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedMaterial);

  } catch (e: any) {
    console.error('Unexpected error in PUT /api/materials/[materialId]:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { materialId: string } }) {
  const { user, errorResponse } = await authenticateRoute(request);
  if (errorResponse) return errorResponse;
  if (!user || !requireAdmin(user)) { // Ensure only admins can delete
    return NextResponse.json({ error: 'Forbidden: Administrator access required' }, { status: 403 });
  }

  const materialId = parseInt(params.materialId, 10);
  if (isNaN(materialId)) {
    return NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 });
  }

  try {
    // 1. Fetch material to get its storage_path
    const { data: material, error: fetchError } = await supabaseAdmin
      .from('course_materials')
      .select('id, storage_path')
      .eq('id', materialId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Material not found' }, { status: 404 });
      }
      console.error(`Error fetching material ${materialId} for delete:`, fetchError);
      return NextResponse.json({ error: 'Failed to fetch material before deletion', details: fetchError.message }, { status: 500 });
    }

    // 2. Delete file from Supabase Storage (if storage_path exists)
    if (material.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([material.storage_path]); // remove expects an array of paths

      if (storageError) {
        // Log the error but proceed to delete the DB record, or handle more gracefully
        console.error(`Error deleting file ${material.storage_path} from Supabase Storage:`, storageError);
        // Optionally, you could return an error here and not delete the DB record if file deletion fails
        // return NextResponse.json({ error: 'Failed to delete file from storage', details: storageError.message }, { status: 500 });
      }
    } else {
        console.warn(`Material ${materialId} had no storage_path. Skipping storage deletion.`);
    }

    // 3. Delete the material record from the database
    const { error: dbDeleteError } = await supabaseAdmin
      .from('course_materials')
      .delete()
      .eq('id', materialId);

    if (dbDeleteError) {
      console.error(`Error deleting material record ${materialId} from database:`, dbDeleteError);
      return NextResponse.json({ error: 'Failed to delete material record', details: dbDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Material deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (e: any) {
    console.error('Unexpected error in DELETE /api/materials/[materialId]:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
