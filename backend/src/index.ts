import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { programsRouter } from './routes/programs';
import { bookingsRouter } from './routes/bookings';
import { usersRouter } from './routes/users';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import supabase from './db/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('health_check').select('*').limit(1).maybeSingle();

    res.json({
      status: 'ok',
      database: error ? 'disconnected' : 'connected',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during health check'
    });
  }
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/programs', authenticateToken, programsRouter);
app.use('/api/bookings', authenticateToken, bookingsRouter);
app.use('/api/users', authenticateToken, usersRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});