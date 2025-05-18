import express from 'express';
import { z } from 'zod';
import supabase from '../db/supabase';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

const profileUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  profilePicture: z.string().url().optional()
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    // Type assertion to AuthRequest
    const authReq = req as AuthRequest;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authReq.user!.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    // Format the response
    const profile = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      role: data.role,
      profilePicture: data.profile_picture,
      createdAt: data.created_at
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    // Type assertion to AuthRequest
    const authReq = req as AuthRequest;

    const updates = profileUpdateSchema.parse(req.body);

    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {};
    if (updates.firstName) dbUpdates.first_name = updates.firstName;
    if (updates.lastName) dbUpdates.last_name = updates.lastName;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.profilePicture) dbUpdates.profile_picture = updates.profilePicture;

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', authReq.user!.id)
      .select()
      .single();

    if (error) throw error;

    // Format the response
    const profile = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      role: data.role,
      profilePicture: data.profile_picture,
      createdAt: data.created_at
    };

    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
});

// Update password
router.put('/password', async (req, res) => {
  try {
    // Type assertion to AuthRequest
    const authReq = req as AuthRequest;

    const { currentPassword, newPassword } = passwordUpdateSchema.parse(req.body);

    // Update password using Supabase Auth API
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
});

export const usersRouter = router;