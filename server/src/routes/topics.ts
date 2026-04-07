import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const topicsRouter = Router();

// Get topics for a level
topicsRouter.get('/:levelId', async (req, res) => {
  const { data } = await supabase
    .from('topics')
    .select('*')
    .eq('level_id', req.params.levelId)
    .order('sort_order');
  res.json(data || []);
});

// Admin: Create topic
topicsRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('topics').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Update topic
topicsRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('topics').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Delete topic
topicsRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('topics').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Reorder topics
topicsRouter.put('/reorder/batch', adminAuth, async (req, res) => {
  const { items } = req.body;
  for (const item of items) {
    await supabase.from('topics').update({ sort_order: item.sort_order }).eq('id', item.id);
  }
  res.json({ success: true });
});
