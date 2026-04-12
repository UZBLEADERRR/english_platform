import { Router } from 'express';
import { supabase } from '../supabase.js';
import crypto from 'crypto';

export const authRouter = Router();

const MAX_SESSIONS = 2;

// Helper: create session and enforce limit
async function createSession(userId: string, deviceType: string = 'browser') {
  const sessionToken = crypto.randomUUID();

  // Insert new session
  await supabase.from('user_sessions').insert({
    user_id: userId,
    session_token: sessionToken,
    device_type: deviceType,
  });

  // Enforce session limit: keep only most recent MAX_SESSIONS
  const { data: sessions } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (sessions && sessions.length > MAX_SESSIONS) {
    const toDelete = sessions.slice(MAX_SESSIONS).map(s => s.id);
    await supabase.from('user_sessions').delete().in('id', toDelete);
  }

  return sessionToken;
}

// Admin login
authRouter.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true, token: password });
  }
  res.status(401).json({ error: 'Invalid password' });
});

// User login/register via Telegram
authRouter.post('/telegram', async (req, res) => {
  const { telegram_id, username, first_name, last_name, avatar_url, referral_code } = req.body;
  
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });

  // Check existing user
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single();

  if (user) {
    // Update info
    const { data: updated } = await supabase
      .from('users')
      .update({ username, first_name, last_name, avatar_url: avatar_url || user.avatar_url })
      .eq('telegram_id', telegram_id)
      .select()
      .single();
    
    const finalUser = updated || user;
    const sessionToken = await createSession(finalUser.id, 'telegram');
    return res.json({ user: finalUser, isNew: false, session_token: sessionToken });
  }

  // Create new user
  const refCode = `ref_${telegram_id}_${Date.now().toString(36)}`;
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id,
      username,
      first_name,
      last_name,
      avatar_url,
      referral_code: refCode,
      referred_by: referral_code || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Track referral
  if (referral_code) {
    await supabase.rpc('increment_referral_registrations', { ref_code: referral_code });
  }

  const sessionToken = await createSession(newUser.id, 'telegram');
  res.json({ user: newUser, isNew: true, session_token: sessionToken });
});

// Get current user
authRouter.get('/me', async (req, res) => {
  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) return res.status(401).json({ error: 'No telegram ID' });

  // Reset daily limits if needed
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', parseInt(telegramId as string))
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Reset daily counters
  const now = new Date();
  const resetAt = new Date(user.ai_messages_reset_at);
  if (now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000) {
    await supabase
      .from('users')
      .update({ ai_messages_today: 0, ai_messages_reset_at: now.toISOString(), grammar_checks_today: 0, grammar_checks_reset_at: now.toISOString() })
      .eq('id', user.id);
    user.ai_messages_today = 0;
    user.grammar_checks_today = 0;
  }

  res.json({ user });
});
