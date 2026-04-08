import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const songsRouter = Router();

// Public: list songs
songsRouter.get('/', async (_, res) => {
  const { data } = await supabase.from('songs').select('*').eq('is_active', true).order('sort_order');
  res.json(data || []);
});

// Admin: get all songs
songsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('songs').select('*').order('sort_order');
  res.json(data || []);
});

// Admin: create
songsRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('songs').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: update
songsRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('songs').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: delete
songsRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('songs').delete().eq('id', req.params.id);
  res.json({ success: true });
});
