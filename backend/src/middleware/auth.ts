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
// Not strictly necessary if middleware correctly types `req` for subsequent handlers,
// but can be kept if preferred style. For now, we'll ensure `req.user` is set on AuthRequest.

export const authenticateJWT = async ( // Renamed from authenticateToken
  req: Request, // Use base Request here, cast/type later or rely on Express's extensibility
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required, no token provided.' });
  }

  try {
    // Verify the JWT token with Supabase
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token); // Destructure user directly

    if (error || !authUser) {
      console.warn('Token verification failed or no user:', error?.message);
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    // At this point, authUser is Supabase's User object.
    // We need to fetch the role from our public.profiles table for application-level role checking.
    // Supabase RLS can use auth.role() if the role is set as a custom claim in the JWT,
    // or it can query the profiles table itself within the policy.
    // For application-level middleware like requireAdmin, fetching from profiles is more explicit.

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.error(`Failed to fetch profile or role for user ${authUser.id}:`, profileError?.message);
      // If profile doesn't exist, it's an inconsistency. Deny access.
      return res.status(403).json({ error: 'User profile not found or inaccessible.' });
    }
    
    // Extend Express Request object (AuthRequest)
    (req as AuthRequest).user = {
      id: authUser.id,
      email: authUser.email || '',
      role: profile.role as string | undefined // Role from public.profiles table
    };

    next();
  } catch (error: any) { // Catch any other unexpected errors
    console.error('Unexpected error during authentication:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export const requireAdmin = (
  req: Request, // Base Request, will be cast or type checked
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthRequest; // Cast to AuthRequest to access user property

  if (!authReq.user) {
    // This should ideally not happen if authenticateJWT runs first and successfully populates req.user
    console.warn('requireAdmin called without user context on request. Ensure authenticateJWT runs first.');
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (authReq.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  next();
};