import { Request, Response, NextFunction } from 'express';
import supabase from '../db/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Type assertion function to convert Express.Request to AuthRequest
const asAuthRequest = (req: Request): AuthRequest => req as AuthRequest;

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Verify the JWT token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Set the user data in the request object
    const authReq = asAuthRequest(req);
    authReq.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: data.user.user_metadata?.role as string | undefined
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};