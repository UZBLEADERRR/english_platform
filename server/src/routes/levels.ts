import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const levelsRouter = Router();

// Get levels for a category
levelsRouter.get('/:categoryId', async (req, res) => {
  const { data } = await supabase
    .from('levels')
    .select('*')
    .eq('category_id', req.params.categoryId)
    .order('level_number');
  res.json(data || []);
});

// Admin: Create level
levelsRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('levels').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Update level
levelsRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('levels').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Init 6 levels for a category
levelsRouter.post('/init/:categoryId', adminAuth, async (req, res) => {
  const categoryId = req.params.categoryId;
  const levels = Array.from({ length: 6 }, (_, i) => ({
    category_id: categoryId,
    level_number: i + 1,
    title: `Level ${i + 1}`,
    is_locked: i > 0,
  }));
  const { data, error } = await supabase.from('levels').upsert(levels, { onConflict: 'category_id,level_number' }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
