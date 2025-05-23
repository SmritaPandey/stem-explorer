import express, { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
// import fs from 'fs'; // For local file system, will be removed/changed for Supabase storage
import { v4 as uuidv4 } from 'uuid';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth'; // Added AuthRequest
import supabase from '../db/supabase'; // Changed from pool to supabase

const router = express.Router();

// Use environment variable for bucket name, with a fallback (though env var should be set)
const COURSE_MATERIALS_BUCKET = process.env.SUPABASE_STORAGE_MATERIALS_BUCKET || 'course_materials_bucket';

// Configure multer for memory storage to pass buffer to Supabase
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (same as before)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Documents
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt',
      // Images
      '.jpg', '.jpeg', '.png', '.gif',
      // Videos
      '.mp4', '.mov', '.avi',
      // Audio
      '.mp3', '.wav',
      // Archives
      '.zip', '.rar'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'));
    }
  }
});

// Zod Schemas
const materialIdParamSchema = z.object({ id: z.string().uuid() });
const programIdParamSchema = z.object({ programId: z.string().uuid() });

const createMaterialSchema = z.object({
  programId: z.string().uuid(), // Changed from number to UUID string
  title: z.string().min(3),
  description: z.string().optional(),
  isPublic: z.preprocess(val => String(val).toLowerCase() === 'true', z.boolean().default(false)),
});

const updateMaterialSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  isPublic: z.preprocess(val => String(val).toLowerCase() === 'true', z.boolean().optional()),
}).strict();


/**
 * Helper function to check if a user has access to a program's materials
 * (User is admin or has a confirmed/completed booking for the program)
 */
async function checkProgramAccess(programId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'admin') return true;

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'confirmed') // or potentially 'completed'
    .eq('program_sessions.program_id', programId) // This join needs to be thought through for RLS or a direct query
    .limit(1)
    .maybeSingle();
  
  // The above query is simplified. A more accurate check would be:
  // 1. Get session_id from bookings where user_id and status match.
  // 2. Get program_id from program_sessions where session_id matches.
  // This is better handled by RLS policies on course_materials table.
  // For direct check:
  const { data: programBooking, error: programBookingError } = await supabase
    .rpc('user_has_program_booking', { p_user_id: userId, p_program_id: programId })

  if (programBookingError) {
    console.error('Error checking program access via RPC:', programBookingError);
    return false;
  }
  return programBooking === true;

  // Fallback, less efficient if RPC not set up:
  // const { data: bookings, error: bookingsError } = await supabase
  //   .from('bookings')
  //   .select('session_id!inner(program_id!inner(id))')
  //   .eq('user_id', userId)
  //   .in('status', ['confirmed', 'completed']);

  // if (bookingsError) {
  //   console.error('Error checking program access:', bookingsError);
  //   return false;
  // }
  // return bookings.some((b: any) => b.session_id?.program_id?.id === programId);
}
// It's recommended to create a PostgreSQL function for checkProgramAccess for efficiency and use it via supabase.rpc()
// Example: CREATE FUNCTION user_has_program_booking(p_user_id UUID, p_program_id UUID) RETURNS BOOLEAN ...

/**
 * @route GET /api/materials
 * @desc Get all course materials (admin only)
 * @access Admin
 */
router.get('/', authenticateJWT, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('course_materials')
      .select(`
        *,
        programs (id, title)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

/**
 * @route GET /api/materials/program/:programId
 * @desc Get materials for a specific program
 * @access Private (with public option)
 */
router.get('/program/:programId', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const paramsParse = programIdParamSchema.safeParse(req.params);
    if (!paramsParse.success) return res.status(400).json({ error: 'Invalid program ID format', details: paramsParse.error.flatten() });
    const { programId } = paramsParse.data;

    const user = req.user!; // Assert user is present due to authenticateJWT

    let query = supabase
      .from('course_materials')
      .select('*')
      .eq('program_id', programId);

    // RLS should primarily handle this, but an explicit check can be an additional layer
    // or used if RLS is not fully covering the "public" vs "enrolled" logic for this specific query.
    // For simplicity, relying on RLS defined in schema.sql for now.
    // The RLS allows select if public OR if user is enrolled.
    
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;

    if (error) throw error;
    res.json({ data });
  } catch (error: any) {
    console.error('Error fetching program materials:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});


/**
 * @route GET /api/materials/:id
 * @desc Get a specific material
 * @access Private (with public option)
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const paramsParse = materialIdParamSchema.safeParse(req.params);
    if (!paramsParse.success) return res.status(400).json({ error: 'Invalid material ID format', details: paramsParse.error.flatten() });
    const { id: materialId } = paramsParse.data;
    
    // RLS will ensure user can only fetch if:
    // 1. They are admin
    // 2. Material is_public = TRUE
    // 3. Material is_public = FALSE AND they are enrolled in the program linked to the material
    const { data: material, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Material not found' });
      throw error;
    }
    if (!material) return res.status(404).json({ error: 'Material not found (should be caught by RLS or single select)' });

    res.json({ data: material });
  } catch (error: any) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

/**
 * @route POST /api/materials
 * @desc Upload a new course material
 * @access Admin
 */
router.post('/', authenticateJWT, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const bodyParse = createMaterialSchema.safeParse(req.body);
    if (!bodyParse.success) return res.status(400).json({ error: 'Invalid input', details: bodyParse.error.flatten() });
    const { programId, title, description, isPublic } = bodyParse.data;
    
    const user = req.user!;

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Check if program exists
    const { data: programExists, error: programError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', programId)
      .maybeSingle();
    if (programError) throw programError;
    if (!programExists) return res.status(404).json({ error: 'Program not found' });
    
    const file = req.file;
    const fileExt = path.extname(file.originalname).substring(1);
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePathInBucket = `public/${programId}/${fileName}`; // Organize by programId

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(COURSE_MATERIALS_BUCKET)
      .upload(filePathInBucket, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // Don't upsert if file with same name exists (uuid should make it unique)
      });

    if (uploadError) throw uploadError;
    if (!uploadData) throw new Error('File upload failed: No data returned from storage.');

    // Save material to database
    const { data: dbMaterial, error: dbError } = await supabase
      .from('course_materials')
      .insert({
        program_id: programId,
        title,
        description: description || null,
        file_url: uploadData.path, // Store the path from Supabase storage
        file_type: fileExt,
        file_size: file.size,
        is_public: isPublic,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (dbError) {
      // If DB insert fails, try to delete the uploaded file from storage
      console.error('DB insert failed after file upload, attempting to delete storage object:', dbError);
      await supabase.storage.from(COURSE_MATERIALS_BUCKET).remove([filePathInBucket]);
      throw dbError;
    }

    res.status(201).json({ data: dbMaterial });
  } catch (error: any) {
     if (error instanceof z.ZodError) { // Should be caught by safeParse earlier
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error uploading material:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});


/**
 * @route PUT /api/materials/:id
 * @desc Update a course material (metadata only, no file re-upload)
 * @access Admin
 */
router.put('/:id', authenticateJWT, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const paramsParse = materialIdParamSchema.safeParse(req.params);
    if (!paramsParse.success) return res.status(400).json({ error: 'Invalid material ID format', details: paramsParse.error.flatten() });
    const { id: materialId } = paramsParse.data;

    const bodyParse = updateMaterialSchema.safeParse(req.body);
    if (!bodyParse.success) return res.status(400).json({ error: 'Invalid input', details: bodyParse.error.flatten() });
    const updates = bodyParse.data;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;


    const { data: updatedMaterial, error } = await supabase
      .from('course_materials')
      .update(dbUpdates)
      .eq('id', materialId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Material not found' });
      throw error;
    }
     if (!updatedMaterial) return res.status(404).json({ error: 'Material not found or no update performed' });

    res.json({ data: updatedMaterial });
  } catch (error: any) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

/**
 * @route DELETE /api/materials/:id
 * @desc Delete a course material and its file from storage
 * @access Admin
 */
router.delete('/:id', authenticateJWT, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const paramsParse = materialIdParamSchema.safeParse(req.params);
    if (!paramsParse.success) return res.status(400).json({ error: 'Invalid material ID format', details: paramsParse.error.flatten() });
    const { id: materialId } = paramsParse.data;

    // Get material details to delete the file from storage
    const { data: material, error: fetchError } = await supabase
      .from('course_materials')
      .select('id, file_url') // Only fetch what's needed
      .eq('id', materialId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') return res.status(404).json({ error: 'Material not found' });
      throw fetchError;
    }
    if (!material) return res.status(404).json({ error: 'Material not found' });
    
    // Delete from database
    const { error: dbDeleteError } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', materialId);

    if (dbDeleteError) {
        // If DB delete fails, we might not want to delete the file yet, or log this carefully.
        console.error("Error deleting material from DB, associated file in storage was not deleted:", dbDeleteError);
        throw dbDeleteError;
    }
    
    // Delete file from Supabase Storage
    if (material.file_url) {
      const { error: storageError } = await supabase.storage
        .from(COURSE_MATERIALS_BUCKET)
        .remove([material.file_url]); // file_url should be the path in the bucket
      
      if (storageError) {
        // Log this error but consider the DB entry successfully deleted.
        // This might require a cleanup job for orphaned files.
        console.error('Error deleting file from storage, but DB entry was removed:', storageError);
      }
    }
    
    res.status(200).json({ message: 'Material deleted successfully' }); // 200 or 204
  } catch (error: any) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: error.message ||'Server error' });
  }
});


/**
 * @route GET /api/materials/download/:id
 * @desc Download a course material file
 * @access Private (with public option or enrollment)
 */
router.get('/download/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const paramsParse = materialIdParamSchema.safeParse(req.params);
    if (!paramsParse.success) return res.status(400).json({ error: 'Invalid material ID format', details: paramsParse.error.flatten() });
    const { id: materialId } = paramsParse.data;
    
    const user = req.user!;

    // Fetch material details, RLS will handle basic access check
    const { data: material, error: materialError } = await supabase
      .from('course_materials')
      .select('*, programs(id)') // Need program_id for checkProgramAccess if RLS isn't enough
      .eq('id', materialId)
      .single();

    if (materialError) {
        if (materialError.code === 'PGRST116') return res.status(404).json({ error: 'Material not found or access denied by RLS' });
        throw materialError;
    }
    if (!material) return res.status(404).json({ error: 'Material not found or access denied by RLS' });

    // Additional check if RLS is not solely sufficient for "is public OR enrolled"
    // The RLS policies on `course_materials` should make this explicit server-side check redundant.
    // If RLS is correctly configured, any user reaching this point *should* have access.

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(COURSE_MATERIALS_BUCKET)
      .download(material.file_url); // material.file_url is the path

    if (downloadError) {
        if (downloadError.message === 'The resource was not found') { // Or check status code if available
            return res.status(404).json({ error: 'File not found in storage.' });
        }
        throw downloadError;
    }
    if (!fileData) throw new Error('File download failed: No data returned from storage.');
    
    // Set headers and send file
    // Determine original filename for download, might need to store original_filename in DB
    const originalFileName = path.basename(material.file_url); // Fallback to path in storage
    res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
    // Supabase download() returns a Blob, need to convert to buffer or stream
    // For express, you can convert Blob to Buffer:
    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.setHeader('Content-Length', buffer.length);
    // Set Content-Type based on file_type if available, or let browser infer
    if(material.file_type){
        // Basic mapping, a library like 'mime-types' would be better
        const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'png': 'image/png', 'jpg': 'image/jpeg', 'txt': 'text/plain',
        };
        res.setHeader('Content-Type', mimeTypes[material.file_type.toLowerCase()] || 'application/octet-stream');
    }

    res.send(buffer);

  } catch (error: any) {
    console.error('Error downloading material:', error);
    if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
  }
});

// Helper function checkProgramAccess is now mostly covered by RLS
// If still needed for very specific checks not covered by RLS on course_materials:
// async function checkProgramAccess(programId: string, userId: string): Promise<boolean> {
//   // ... implementation using Supabase ...
//   // This function would typically check if a user is enrolled in a program.
//   // This logic is now expected to be part of the RLS policy on 'course_materials'.
//   return false; // Placeholder if RLS is primary mechanism
// }

export const materialsRouter = router;
