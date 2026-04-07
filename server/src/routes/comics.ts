import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const comicsRouter = Router();

// Get all comics
comicsRouter.get('/', async (_, res) => {
  const { data } = await supabase.from('comics').select('*').eq('is_active', true).order('sort_order');
  res.json(data || []);
});

// Get comic with pages
comicsRouter.get('/:id', async (req, res) => {
  const { data: comic } = await supabase.from('comics').select('*').eq('id', req.params.id).single();
  if (!comic) return res.status(404).json({ error: 'Not found' });
  
  const { data: pages } = await supabase
    .from('comic_pages')
    .select('*')
    .eq('comic_id', req.params.id)
    .order('page_number');
  
  res.json({ ...comic, pages: pages || [] });
});

// Admin
comicsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('comics').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

comicsRouter.post('/', adminAuth, async (req, res) => {
  const { pages, ...comicData } = req.body;
  const { data: comic, error } = await supabase.from('comics').insert(comicData).select().single();
  if (error) return res.status(500).json({ error: error.message });
  
  if (pages?.length) {
    const pageRecords = pages.map((url: string, i: number) => ({
      comic_id: comic.id,
      image_url: url,
      page_number: i + 1,
    }));
    await supabase.from('comic_pages').insert(pageRecords);
  }
  
  res.json(comic);
});

comicsRouter.put('/:id', adminAuth, async (req, res) => {
  const { pages, ...comicData } = req.body;
  const { data, error } = await supabase.from('comics').update(comicData).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  
  if (pages) {
    await supabase.from('comic_pages').delete().eq('comic_id', req.params.id);
    const pageRecords = pages.map((url: string, i: number) => ({
      comic_id: req.params.id,
      image_url: url,
      page_number: i + 1,
    }));
    await supabase.from('comic_pages').insert(pageRecords);
  }
  
  res.json(data);
});

comicsRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('comics').delete().eq('id', req.params.id);
  res.json({ success: true });
});
