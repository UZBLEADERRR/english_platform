import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_, res) => {
  const { data } = await supabase.from('category_cards').select('*').eq('is_active', true).order('sort_order');
  res.json(data);
});

categoriesRouter.put('/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('category_cards')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
