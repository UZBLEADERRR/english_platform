import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const moviesRouter = Router();

// Get movie categories
moviesRouter.get('/categories', async (_, res) => {
  const { data } = await supabase.from('movie_categories').select('*').order('sort_order');
  res.json(data || []);
});

// Get movies by category
moviesRouter.get('/category/:categoryId', async (req, res) => {
  const { data } = await supabase
    .from('movies')
    .select('*')
    .eq('category_id', req.params.categoryId)
    .eq('is_active', true)
    .order('sort_order');
  res.json(data || []);
});

// Get all movies
moviesRouter.get('/', async (_, res) => {
  const { data } = await supabase
    .from('movies')
    .select('*, movie_categories(name)')
    .eq('is_active', true)
    .order('sort_order');
  res.json(data || []);
});

// Get single movie
moviesRouter.get('/:id', async (req, res) => {
  const { data } = await supabase.from('movies').select('*, movie_categories(name)').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Get movie carousel
moviesRouter.get('/carousel/all', async (_, res) => {
  const { data } = await supabase.from('movie_carousel').select('*').eq('is_active', true).order('sort_order');
  res.json(data || []);
});

// Search movies
moviesRouter.get('/search/:query', async (req, res) => {
  const { data } = await supabase
    .from('movies')
    .select('*')
    .eq('is_active', true)
    .ilike('title', `%${req.params.query}%`);
  res.json(data || []);
});

// Admin routes
moviesRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('movies').select('*, movie_categories(name)').order('created_at', { ascending: false });
  res.json(data || []);
});

moviesRouter.post('/categories', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('movie_categories').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

moviesRouter.post('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('movies').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

moviesRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('movies').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

moviesRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('movies').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Movie carousel admin
moviesRouter.post('/carousel', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('movie_carousel').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

moviesRouter.delete('/carousel/:id', adminAuth, async (req, res) => {
  await supabase.from('movie_carousel').delete().eq('id', req.params.id);
  res.json({ success: true });
});
