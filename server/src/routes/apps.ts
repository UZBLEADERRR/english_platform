import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const appsRouter = Router();

// Public: get admin apps
appsRouter.get('/', async (_, res) => {
  const { data } = await supabase.from('apps').select('*').eq('is_active', true).eq('is_admin_app', true).order('sort_order');
  res.json(data || []);
});

// User apps (user-created)
appsRouter.get('/user', async (_, res) => {
  const { data } = await supabase.from('apps').select('*').eq('is_active', true).eq('is_admin_app', false).order('sort_order');
  res.json(data || []);
});

appsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

appsRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('apps').insert({ ...req.body, is_admin_app: true }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

appsRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('apps').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

appsRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('apps').delete().eq('id', req.params.id);
  res.json({ success: true });
});
