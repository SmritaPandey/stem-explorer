import express from 'express';
import { z } from 'zod';
import pool from '../db';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

const bookingSchema = z.object({
  programId: z.number(),
  status: z.enum(['Pending', 'Confirmed', 'Cancelled'])
});

// Get user's bookings
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, p.title, p.date, p.time, p.location 
       FROM bookings b 
       JOIN programs p ON b.program_id = p.id 
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create new booking
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { programId } = bookingSchema.parse(req.body);

    // Check if program exists and has available seats
    const programResult = await pool.query(
      'SELECT seats FROM programs WHERE id = $1',
      [programId]
    );

    if (programResult.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    if (programResult.rows[0].seats <= 0) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Start transaction
    await pool.query('BEGIN');

    // Create booking
    const bookingResult = await pool.query(
      'INSERT INTO bookings (user_id, program_id, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user!.id, programId, 'Confirmed']
    );

    // Update available seats
    await pool.query(
      'UPDATE programs SET seats = seats - 1 WHERE id = $1',
      [programId]
    );

    await pool.query('COMMIT');

    res.status(201).json(bookingResult.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
});

// Cancel booking
router.put('/:id/cancel', async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Start transaction
    await pool.query('BEGIN');

    // Update booking status
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING program_id',
      ['Cancelled', bookingId, req.user!.id]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Increase available seats
    await pool.query(
      'UPDATE programs SET seats = seats + 1 WHERE id = $1',
      [result.rows[0].program_id]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export const bookingsRouter = router;