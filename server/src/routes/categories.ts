import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_, res) => {
  const { data } = await supabase.from('category_cards').select('*').eq('is_active', true).order('sort_order');
  res.json(data);
});

categoriesRouter.put('/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body, id, is_active: true };
  const { data, error } = await supabase
    .from('category_cards')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
