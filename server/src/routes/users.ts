import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const usersRouter = Router();

// Login with Telegram ID + code (from bot)
usersRouter.post('/login-code', async (req, res) => {
  const { telegram_id, code } = req.body;
  if (!telegram_id || !code) return res.status(400).json({ error: 'telegram_id va code kerak' });

  const { data: loginCode } = await supabase
    .from('login_codes')
    .select('*')
    .eq('telegram_id', parseInt(telegram_id))
    .eq('code', code)
    .single();

  if (!loginCode) return res.status(401).json({ error: 'Kod noto\'g\'ri yoki topilmadi' });

  // Check expiry
  if (new Date(loginCode.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Kod muddati tugagan. Botdan yangi kod oling.' });
  }

  // Get user
  const { data: user } = await supabase.from('users').select('*').eq('id', loginCode.user_id).single();
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

  // Delete used code
  await supabase.from('login_codes').delete().eq('id', loginCode.id);

  res.json(user);
});

// Admin: Get all users
usersRouter.get('/admin/all', adminAuth, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  
  let query = supabase.from('users').select('*', { count: 'exact' });
  
  if (search) {
    query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,telegram_id.eq.${parseInt(search) || 0}`);
  }
  
  const { data, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  res.json({ users: data || [], total: count || 0, page, limit });
});

// Admin: Get single user
usersRouter.get('/admin/:id', adminAuth, async (req, res) => {
  const { data } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Admin: Update user (block, change subscription, etc)
usersRouter.put('/admin/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Block user
usersRouter.post('/admin/block/:id', adminAuth, async (req, res) => {
  await supabase.from('users').update({ is_blocked: true }).eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Unblock user
usersRouter.post('/admin/unblock/:id', adminAuth, async (req, res) => {
  await supabase.from('users').update({ is_blocked: false }).eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Set subscription
usersRouter.post('/admin/subscription/:id', adminAuth, async (req, res) => {
  const { subscription } = req.body;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  
  await supabase.from('users').update({ 
    subscription,
    subscription_expires_at: subscription === 'free' ? null : expiresAt.toISOString()
  }).eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Get user credits/token usage
usersRouter.get('/admin/credits/:id', adminAuth, async (req, res) => {
  const { data } = await supabase.from('users').select('ai_credits_used, ai_messages_today, subscription').eq('id', req.params.id).single();
  res.json(data);
});

// Admin: Dashboard stats
usersRouter.get('/admin/stats/overview', adminAuth, async (_, res) => {
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: premiumUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription', 'premium');
  const { count: ultraUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription', 'ultra');
  const { count: blockedUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', true);
  const { data: totalCredits } = await supabase.from('users').select('ai_credits_used');
  const totalAiCredits = totalCredits?.reduce((sum, u) => sum + (u.ai_credits_used || 0), 0) || 0;
  
  // Today's new users
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
  
  res.json({ totalUsers, premiumUsers, ultraUsers, blockedUsers, totalAiCredits, todayUsers });
});

// User: Update own profile
usersRouter.put('/profile', async (req, res) => {
  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) return res.status(401).json({ error: 'No telegram ID' });
  
  const { first_name, avatar_url, age, gender } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ first_name, avatar_url, age, gender })
    .eq('telegram_id', parseInt(telegramId as string))
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
