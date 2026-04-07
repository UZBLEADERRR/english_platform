import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const tipsRouter = Router();

tipsRouter.get('/', async (_, res) => {
  const { data } = await supabase.from('tips').select('*').eq('is_active', true).order('sort_order');
  res.json(data || []);
});

tipsRouter.get('/:id', async (req, res) => {
  const { data } = await supabase.from('tips').select('*').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

tipsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('tips').select('*').order('sort_order');
  res.json(data || []);
});

tipsRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('tips').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

tipsRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('tips').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

tipsRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('tips').delete().eq('id', req.params.id);
  res.json({ success: true });
});
