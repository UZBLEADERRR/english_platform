import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const reelsRouter = Router();

// Get all reel categories with words
reelsRouter.get('/categories', async (_, res) => {
  const { data } = await supabase.from('reel_categories').select('*, reel_words(count)').order('sort_order');
  res.json(data || []);
});

// Get words for a category (excluding known words for user)
reelsRouter.get('/words/:categoryId', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  
  let query = supabase
    .from('reel_words')
    .select('*')
    .eq('category_id', req.params.categoryId)
    .order('created_at', { ascending: true });
  
  const { data: words } = await query;
  
  if (userId && words) {
    // Get known words
    const { data: knownWords } = await supabase
      .from('user_known_words')
      .select('word_id')
      .eq('user_id', userId)
      .eq('is_known', true);
    
    const knownIds = new Set(knownWords?.map(k => k.word_id) || []);
    const filtered = words.filter(w => !knownIds.has(w.id));
    return res.json(filtered);
  }
  
  res.json(words || []);
});

// Mark word as known/unknown
reelsRouter.post('/mark', async (req, res) => {
  const { user_id, word_id, is_known } = req.body;
  const { data, error } = await supabase
    .from('user_known_words')
    .upsert({ user_id, word_id, is_known }, { onConflict: 'user_id,word_id' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get user's known/unknown words
reelsRouter.get('/user-words/:userId', async (req, res) => {
  const { data: known } = await supabase
    .from('user_known_words')
    .select('*, reel_words(*)')
    .eq('user_id', req.params.userId)
    .eq('is_known', true);
  
  const { data: unknown } = await supabase
    .from('user_known_words')
    .select('*, reel_words(*)')
    .eq('user_id', req.params.userId)
    .eq('is_known', false);
  
  res.json({ known: known || [], unknown: unknown || [] });
});

// Admin routes
reelsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('reel_categories').select('*, reel_words(*)').order('sort_order');
  res.json(data || []);
});

reelsRouter.post('/categories', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('reel_categories').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

reelsRouter.put('/categories/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('reel_categories').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

reelsRouter.delete('/categories/:id', adminAuth, async (req, res) => {
  await supabase.from('reel_categories').delete().eq('id', req.params.id);
  res.json({ success: true });
});

reelsRouter.post('/words', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('reel_words').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

reelsRouter.delete('/words/:id', adminAuth, async (req, res) => {
  await supabase.from('reel_words').delete().eq('id', req.params.id);
  res.json({ success: true });
});
