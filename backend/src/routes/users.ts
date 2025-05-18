import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

const profileUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  bio: z.string().optional(),
  age: z.number().min(5).max(18).optional(),
  grade: z.string().optional(),
  interests: z.array(z.string()).optional()
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
});

// Get user profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, bio, age, grade, interests FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const updates = profileUpdateSchema.parse(req.body);
    
    const setClause = Object.entries(updates)
      .map(([key, _], index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(updates);
    
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, email, first_name, last_name, bio, age, grade, interests`,
      [req.user!.id, ...values]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
});

// Update password
router.put('/password', async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = passwordUpdateSchema.parse(req.body);
    
    // Verify current password
    const user = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, req.user!.id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
});

export const usersRouter = router;