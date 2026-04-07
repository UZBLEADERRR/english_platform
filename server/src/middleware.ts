import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase.js';

export async function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  // Simple admin password check or user role check
  if (token === process.env.ADMIN_PASSWORD) {
    (req as any).isAdmin = true;
    return next();
  }

  // Check if it's a telegram user with admin role
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', parseInt(token))
      .eq('role', 'admin')
      .single();
    
    if (data) {
      (req as any).isAdmin = true;
      (req as any).adminUser = data;
      return next();
    }
  } catch {}

  return res.status(403).json({ error: 'Forbidden' });
}

export async function userAuth(req: Request, res: Response, next: NextFunction) {
  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) return res.status(401).json({ error: 'No telegram ID' });

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', parseInt(telegramId as string))
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.is_blocked) return res.status(403).json({ error: 'User blocked' });

  (req as any).user = user;
  next();
}
