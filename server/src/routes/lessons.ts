import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const lessonsRouter = Router();

// Get lesson elements for a topic
lessonsRouter.get('/:topicId', async (req, res) => {
  const { data } = await supabase
    .from('lesson_elements')
    .select('*')
    .eq('topic_id', req.params.topicId)
    .order('sort_order');
  res.json(data || []);
});

// Admin: Create element
lessonsRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('lesson_elements').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Update element
lessonsRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('lesson_elements').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Delete element
lessonsRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('lesson_elements').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Batch reorder (drag & drop)
lessonsRouter.put('/reorder/batch', adminAuth, async (req, res) => {
  const { items } = req.body; // [{ id, sort_order }]
  for (const item of items) {
    await supabase.from('lesson_elements').update({ sort_order: item.sort_order }).eq('id', item.id);
  }
  res.json({ success: true });
});

// Admin: Batch create (for drag & drop)
lessonsRouter.post('/batch', adminAuth, async (req, res) => {
  const { elements } = req.body;
  const { data, error } = await supabase.from('lesson_elements').insert(elements).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
