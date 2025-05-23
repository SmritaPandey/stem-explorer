import { supabase } from './supabase'; // Frontend Supabase client
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'course-materials';

interface UploadResult {
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

/**
 * Uploads a file to Supabase Storage.
 * @param file The file to upload.
 * @param programId The ID of the program this material is associated with (for path organization).
 * @param onProgress Optional callback to track upload progress (percentage).
 * @returns An object with storage_path, file_name, file_type, and file_size, or null on failure.
 */
export async function uploadMaterialToSupabase(
  file: File,
  programId: number | string, // Allow string if program IDs are UUIDs
  onProgress?: (percentage: number) => void
): Promise<UploadResult | null> {
  if (!file || !programId) {
    console.error("File and programId are required for upload.");
    return null;
  }

  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  // Organize by program, then by material UUID for uniqueness
  const filePath = `program-${programId}/${uniqueFileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600', // Cache for 1 hour
        upsert: false, // Do not overwrite if file with same path exists (uuid should prevent this)
        //contentType: file.type, // Supabase client infers this, but can be set explicitly
      }); // Removed x-upsert-on-progress due to deprecation/issues, handle progress differently if needed

    if (error) {
      console.error('Error uploading file to Supabase Storage:', error);
      throw error; // Re-throw to be caught by caller
    }

    if (data) {
      return {
        storage_path: data.path, // This is the 'path' returned by Supabase, not full URL
        file_name: file.name,     // Original file name
        file_type: file.type,
        file_size: file.size,
      };
    }
    return null;
  } catch (error) {
    console.error('Unexpected error during Supabase Storage upload:', error);
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage.
 * @param storagePath The path of the file in the bucket.
 * @returns True if successful, false otherwise.
 */
export async function deleteMaterialFromSupabase(storagePath: string): Promise<boolean> {
    if (!storagePath) {
        console.error("Storage path is required for deletion.");
        return false;
    }
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([storagePath]); // remove expects an array of paths

        if (error) {
            console.error('Error deleting file from Supabase Storage:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Unexpected error during Supabase Storage deletion:', error);
        return false;
    }
}
