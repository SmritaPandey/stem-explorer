import express from 'express';
import { z } from 'zod';
import pool from '../db';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

const programSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  longDescription: z.string().optional(),
  category: z.string(),
  level: z.string(),
  duration: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string().optional(),
  instructor: z.string().optional(),
  seats: z.number().min(1),
  price: z.number().min(0),
  ageGroup: z.string().optional(),
  format: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional()
});

// Get all programs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM programs ORDER BY date ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get single program
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM programs WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

// Create new program (admin only)
router.post('/', async (req, res) => {
  try {
    const programData = programSchema.parse(req.body);
    
    const result = await pool.query(
      `INSERT INTO programs (
        title, description, long_description, category, level,
        duration, date, time, location, instructor, seats,
        price, age_group, format, requirements, topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        programData.title,
        programData.description,
        programData.longDescription,
        programData.category,
        programData.level,
        programData.duration,
        programData.date,
        programData.time,
        programData.location,
        programData.instructor,
        programData.seats,
        programData.price,
        programData.ageGroup,
        programData.format,
        programData.requirements,
        programData.topics
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create program' });
    }
  }
});

export const programsRouter = router;