import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const carouselRouter = Router();

// Get all carousel images (public)
carouselRouter.get('/', async (_, res) => {
  const { data, error } = await supabase
    .from('carousel_images')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Get all (including inactive)
carouselRouter.get('/admin', adminAuth, async (_, res) => {
  const { data } = await supabase.from('carousel_images').select('*').order('sort_order');
  res.json(data);
});

// Admin: Add image
carouselRouter.post('/', adminAuth, async (req, res) => {
  const { image_url, title, subtitle, link } = req.body;
  const { data: maxOrder } = await supabase.from('carousel_images').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  const sortOrder = (maxOrder?.[0]?.sort_order || 0) + 1;
  
  const { data, error } = await supabase
    .from('carousel_images')
    .insert({ image_url, title, subtitle, link, sort_order: sortOrder })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Update image
carouselRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('carousel_images')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: Delete image
carouselRouter.delete('/:id', adminAuth, async (req, res) => {
  await supabase.from('carousel_images').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Reorder
carouselRouter.put('/reorder/batch', adminAuth, async (req, res) => {
  const { items } = req.body; // [{ id, sort_order }]
  for (const item of items) {
    await supabase.from('carousel_images').update({ sort_order: item.sort_order }).eq('id', item.id);
  }
  res.json({ success: true });
});
