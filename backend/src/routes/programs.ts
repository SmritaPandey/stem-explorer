import express from 'express';
import { z } from 'zod';
import supabase from '../db/supabase';
import { AuthRequest, authenticateJWT, requireAdmin } from '../middleware/auth'; // Added authenticateJWT, requireAdmin

const router = express.Router();

const programSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  ageRange: z.string(),
  price: z.number().min(0),
  duration: z.number().min(15),
  maxCapacity: z.number().min(1),
  location: z.string(),
  instructorId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true)
});

const sessionSchema = z.object({
  programId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime()
});

// Get all programs
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get single program with its sessions
router.get('/:id', async (req, res) => {
  try {
    // Get the program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (programError) {
      if (programError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Program not found' });
      }
      throw programError;
    }

    // Get the program sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('program_sessions')
      .select('*')
      .eq('program_id', req.params.id)
      .order('start_time', { ascending: true });

    if (sessionsError) throw sessionsError;

    res.json({
      ...program,
      sessions: sessions || []
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

// Create new program (admin only)
router.post('/', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => { // Added middleware and typed req
  try {
    // const authReq = req as AuthRequest; // No longer needed due to middleware typing req as AuthRequest
    const programData = programSchema.parse(req.body);

    // TODO: Potentially add 'created_by: req.user!.id' if schema supports it
    // Insert the program
    const { data, error } = await supabase
      .from('programs')
      .insert({
        title: programData.title,
        description: programData.description,
        category: programData.category,
        age_range: programData.ageRange,
        price: programData.price,
        duration: programData.duration,
        max_capacity: programData.maxCapacity,
        location: programData.location,
        instructor_id: programData.instructorId,
        image_url: programData.imageUrl,
        is_active: programData.isActive
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating program:', error);
      res.status(500).json({ error: 'Failed to create program' });
    }
  }
});

// Create new program session
router.post('/sessions', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => { // Added middleware and typed req
  try {
    // const authReq = req as AuthRequest; // No longer needed
    const sessionData = sessionSchema.parse(req.body);

    // TODO: Potentially add 'created_by: req.user!.id' if schema supports it
    // Insert the session
    const { data, error } = await supabase
      .from('program_sessions')
      .insert({
        program_id: sessionData.programId,
        start_time: sessionData.startTime,
        end_time: sessionData.endTime
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating program session:', error);
      res.status(500).json({ error: 'Failed to create program session' });
    }
  }
});

export const programsRouter = router;