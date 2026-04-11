import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const adminRouter = Router();

// Get pricing config (public)
adminRouter.get('/pricing/public', async (_, res) => {
  const { data } = await supabase.from('pricing_config').select('*').order('sort_order');
  res.json(data || []);
});

// Get pricing config (admin)
adminRouter.get('/pricing', adminAuth, async (_, res) => {
  const { data } = await supabase.from('pricing_config').select('*').order('sort_order');
  res.json(data || []);
});

// Save pricing config
adminRouter.post('/pricing', adminAuth, async (req, res) => {
  const { plans } = req.body;
  if (!plans || !Array.isArray(plans)) return res.status(400).json({ error: 'Invalid data' });
  
  // Upsert each plan
  for (const plan of plans) {
    await supabase.from('pricing_config').upsert({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      daily_messages: plan.daily_messages,
      daily_grammar: plan.daily_grammar,
      max_artifacts: plan.max_artifacts,
      features: plan.features,
    }, { onConflict: 'id' });
  }
  
  res.json({ success: true });
});

// Get platform stats
adminRouter.get('/stats', adminAuth, async (_, res) => {
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: premiumUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription', 'premium');
  const { count: ultraUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription', 'ultra');
  
  res.json({
    totalUsers: totalUsers || 0,
    premiumUsers: premiumUsers || 0,
    ultraUsers: ultraUsers || 0,
    freeUsers: (totalUsers || 0) - (premiumUsers || 0) - (ultraUsers || 0),
  });
});
