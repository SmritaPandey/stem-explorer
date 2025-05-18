import express, { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import pool from '../db';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/materials');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and media file types
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
      cb(new Error('Invalid file type'));
    }
  }
});

const materialSchema = z.object({
  programId: z.number(),
  title: z.string().min(3),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

/**
 * @route GET /api/materials
 * @desc Get all course materials (admin only)
 * @access Admin
 */
router.get('/', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.title as program_title 
      FROM course_materials m
      JOIN programs p ON m.program_id = p.id
      ORDER BY m.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/materials/program/:programId
 * @desc Get materials for a specific program
 * @access Private (with public option)
 */
router.get('/program/:programId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const programId = parseInt(req.params.programId);
    const user = req.user as any;
    
    if (isNaN(programId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid program ID'
      });
    }
    
    // Check if user has access to this program
    const hasAccess = await checkProgramAccess(programId, user.id);
    
    let query = `
      SELECT * FROM course_materials 
      WHERE program_id = $1 
    `;
    
    // If user doesn't have access, only show public materials
    if (!hasAccess && user.role !== 'admin') {
      query += 'AND is_public = true ';
    }
    
    query += 'ORDER BY created_at DESC';
    
    const result = await pool.query(query, [programId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching program materials:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/materials/:id
 * @desc Get a specific material
 * @access Private (with public option)
 */
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    const user = req.user as any;
    
    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material ID'
      });
    }
    
    // Get material details
    const materialResult = await pool.query(
      'SELECT * FROM course_materials WHERE id = $1',
      [materialId]
    );
    
    if (materialResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    const material = materialResult.rows[0];
    
    // Check if user has access to this program's materials
    const hasAccess = await checkProgramAccess(material.program_id, user.id);
    
    // If material is not public and user doesn't have access
    if (!material.is_public && !hasAccess && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route POST /api/materials
 * @desc Upload a new course material
 * @access Admin
 */
router.post('/', authenticateJWT, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { programId, title, description, isPublic } = materialSchema.parse(req.body);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Check if program exists
    const programResult = await pool.query(
      'SELECT id FROM programs WHERE id = $1',
      [programId]
    );
    
    if (programResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }
    
    // Get file details
    const fileUrl = `/uploads/materials/${req.file.filename}`;
    const fileType = path.extname(req.file.originalname).substring(1);
    
    // Save material to database
    const result = await pool.query(
      `INSERT INTO course_materials (
        program_id, title, description, file_url, file_type, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [programId, title, description || '', fileUrl, fileType, isPublic]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors
      });
    } else {
      console.error('Error uploading material:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
});

/**
 * @route PUT /api/materials/:id
 * @desc Update a course material
 * @access Admin
 */
router.put('/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    
    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material ID'
      });
    }
    
    // Check if material exists
    const materialResult = await pool.query(
      'SELECT id FROM course_materials WHERE id = $1',
      [materialId]
    );
    
    if (materialResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    // Update only the provided fields
    const updates: Record<string, any> = {};
    
    if (req.body.title !== undefined) {
      updates.title = req.body.title;
    }
    
    if (req.body.description !== undefined) {
      updates.description = req.body.description;
    }
    
    if (req.body.isPublic !== undefined) {
      updates.is_public = req.body.isPublic;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    // Generate SQL query
    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`);
    const values = Object.values(updates);
    
    const query = `
      UPDATE course_materials
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [materialId, ...values]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route DELETE /api/materials/:id
 * @desc Delete a course material
 * @access Admin
 */
router.delete('/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    
    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material ID'
      });
    }
    
    // Get material details to delete the file
    const materialResult = await pool.query(
      'SELECT file_url FROM course_materials WHERE id = $1',
      [materialId]
    );
    
    if (materialResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    const material = materialResult.rows[0];
    
    // Delete from database
    await pool.query(
      'DELETE FROM course_materials WHERE id = $1',
      [materialId]
    );
    
    // Delete file from filesystem
    if (material.file_url) {
      const filePath = path.join(__dirname, '../../', material.file_url);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route GET /api/materials/download/:id
 * @desc Download a course material
 * @access Private (with public option)
 */
router.get('/download/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    const user = req.user as any;
    
    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material ID'
      });
    }
    
    // Get material details
    const materialResult = await pool.query(
      'SELECT * FROM course_materials WHERE id = $1',
      [materialId]
    );
    
    if (materialResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    const material = materialResult.rows[0];
    
    // Check if user has access to this program's materials
    const hasAccess = await checkProgramAccess(material.program_id, user.id);
    
    // If material is not public and user doesn't have access
    if (!material.is_public && !hasAccess && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Get file path
    const filePath = path.join(__dirname, '../../', material.file_url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Send file
    res.download(filePath, `${material.title}.${material.file_type}`);
  } catch (error) {
    console.error('Error downloading material:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * Helper function to check if a user has access to a program's materials
 */
async function checkProgramAccess(programId: number, userId: number): Promise<boolean> {
  try {
    // Check if user has a confirmed booking for this program
    const result = await pool.query(
      'SELECT id FROM bookings WHERE program_id = $1 AND user_id = $2 AND status = $3',
      [programId, userId, 'Confirmed']
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking program access:', error);
    return false;
  }
}

export const materialsRouter = router;
