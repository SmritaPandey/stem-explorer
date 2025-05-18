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

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

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