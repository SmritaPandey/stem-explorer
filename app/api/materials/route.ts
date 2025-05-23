import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRoute, requireAdmin, AuthenticatedUser } from '@/lib/api/auth-utils';
import supabaseAdmin from '@/lib/supabaseAdmin';

const BUCKET_NAME = 'course-materials';

// Zod schema for creating new material metadata
// (after file is uploaded to Supabase Storage by client)
const materialCreateSchema = z.object({
  programId: z.number().int().positive({ message: "Program ID must be a positive integer." }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  storagePath: z.string().min(1, { message: "Storage path is required." }), // Path in Supabase bucket
  fileName: z.string().min(1, { message: "File name is required." }),
  fileType: z.string().min(1, { message: "File type is required." }), // e.g., 'application/pdf', 'image/png'
  fileSize: z.number().int().positive({ message: "File size must be a positive integer." }), // Size in bytes
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

  const validation = materialCreateSchema.safeParse(reqBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { programId, title, description, isPublic, storagePath, fileName, fileType, fileSize } = validation.data;

  try {
    // Verify programId exists (optional, but good practice)
    const { data: programExists, error: programCheckError } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('id', programId)
      .maybeSingle();

    if (programCheckError) {
      console.error("Error checking program existence:", programCheckError.message);
      return NextResponse.json({ error: "Failed to verify program existence.", details: programCheckError.message }, { status: 500 });
    }
    if (!programExists) {
      return NextResponse.json({ error: "Program not found with the provided programId." }, { status: 404 });
    }

    // Generate the public URL for the stored file
    const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const publicFileUrl = urlData.publicUrl;

    const materialToInsert = {
      program_id: programId,
      title,
      description: description || null,
      is_public: isPublic,
      file_url: publicFileUrl, // Store the public URL
      storage_path: storagePath, // Store the bucket path for potential future direct operations (like delete)
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      // uploaded_by: user.id, // Optional: track who uploaded
    };

    const { data: newMaterial, error: insertError } = await supabaseAdmin
      .from('course_materials') // Ensure this is your table name
      .insert(materialToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating material record:', insertError);
      // If it's a duplicate storage_path, that's an issue.
      // Consider if client should check for existing file by name/path before upload, or if API handles it.
      return NextResponse.json({ error: 'Failed to create material record', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newMaterial, { status: 201 });

  } catch (e: any) {
    console.error('Unexpected error in POST /api/materials:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
