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

// Get single topic by ID
topicsRouter.get('/single/:id', async (req, res) => {
  const { data } = await supabase
    .from('topics')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (!data) return res.status(404).json({ error: 'Topic not found' });
  res.json(data);
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

// User: Mark topic as completed
topicsRouter.post('/:id/complete', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'User ID missing' });

  const { data, error } = await supabase
    .from('user_progress')
    .upsert({ 
      user_id: userId, 
      topic_id: req.params.id, 
      completed: true, 
      completed_at: new Date().toISOString() 
    }, { onConflict: 'user_id,topic_id' })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// User: Get all completed topics
topicsRouter.get('/progress/:userId', async (req, res) => {
  const { data } = await supabase
    .from('user_progress')
    .select('topic_id')
    .eq('user_id', req.params.userId)
    .eq('completed', true);
  
  res.json(data?.map(p => p.topic_id) || []);
});
