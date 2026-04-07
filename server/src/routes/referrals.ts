import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const referralsRouter = Router();

referralsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('referral_links').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

referralsRouter.post('/', adminAuth, async (req, res) => {
  const { name } = req.body;
  const code = `ref_${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now().toString(36)}`;
  const { data, error } = await supabase.from('referral_links').insert({ name, code }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

referralsRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('referral_links').delete().eq('id', req.params.id);
  res.json({ success: true });
});

referralsRouter.post('/click/:code', async (req, res) => {
  const { data: link } = await supabase.from('referral_links').select('*').eq('code', req.params.code).single();
  if (!link) return res.status(404).json({ error: 'Invalid' });
  await supabase.from('referral_links').update({ clicks: (link.clicks || 0) + 1 }).eq('id', link.id);
  res.json({ success: true });
});

referralsRouter.get('/stats/:code', adminAuth, async (req, res) => {
  const { data: link } = await supabase.from('referral_links').select('*').eq('code', req.params.code).single();
  if (!link) return res.status(404).json({ error: 'Not found' });
  const { data: users } = await supabase.from('users').select('id, telegram_id, first_name, username, subscription, created_at').eq('referred_by', req.params.code);
  res.json({ link, users: users || [] });
});
