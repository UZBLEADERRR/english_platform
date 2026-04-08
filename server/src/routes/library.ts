import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const libraryRouter = Router();

// Public: list books
libraryRouter.get('/', async (_, res) => {
  const { data } = await supabase.from('library').select('*').eq('is_active', true).order('sort_order');
  res.json(data || []);
});

// Admin: get all
libraryRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('library').select('*').order('sort_order');
  res.json(data || []);
});

// Admin: create
libraryRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('library').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: update
libraryRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('library').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: delete
libraryRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('library').delete().eq('id', req.params.id);
  res.json({ success: true });
});
