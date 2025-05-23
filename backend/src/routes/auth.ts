import express from 'express';
import { z } from 'zod';
import supabase from '../db/supabase';

const router = express.Router();

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = registerSchema.parse(req.body);

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Insert additional user data into profiles table
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email
        });

      if (profileError) {
        console.error('Critical error creating profile after auth user creation:', profileError);
        // This is a critical issue. The user exists in auth.users but not in public.profiles.
        // Ideally, we might try to delete the auth.user here, but that adds complexity.
        // For now, return a server error indicating profile creation failure.
        return res.status(500).json({ error: 'User registered but failed to create user profile.' });
      }
    } else {
      // This case should ideally not be reached if authError is handled,
      // but as a safeguard:
      return res.status(500).json({ error: 'User registration succeeded but no user data returned.' });
    }

    res.status(201).json({
      message: 'Registration successful',
      user: authData.user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      // Log the actual error for server-side inspection
      console.error('Registration process error:', error);
      // Return a generic server error message to the client
      res.status(500).json({ error: 'An unexpected error occurred during registration.' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export const authRouter = router;