import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const paymentsRouter = Router();

// Get payment cards (active)
paymentsRouter.get('/cards', async (_, res) => {
  const { data } = await supabase.from('payment_cards').select('*').eq('is_active', true);
  res.json(data || []);
});

// User: Submit payment
paymentsRouter.post('/', async (req, res) => {
  const { user_id, plan, amount, screenshot_url, card_id } = req.body;
  const { data, error } = await supabase
    .from('payments')
    .insert({ user_id, plan, amount, screenshot_url, card_id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get user's payments
paymentsRouter.get('/user/:userId', async (req, res) => {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false });
  res.json(data || []);
});

// Admin: Get all payments
paymentsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase
    .from('payments')
    .select('*, users(telegram_id, first_name, last_name, username)')
    .order('created_at', { ascending: false });
  res.json(data || []);
});

// Admin: Get pending payments
paymentsRouter.get('/admin/pending', adminAuth, async (_, res) => {
  const { data } = await supabase
    .from('payments')
    .select('*, users(telegram_id, first_name, last_name, username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  res.json(data || []);
});

// Admin: Approve payment
paymentsRouter.post('/admin/approve/:id', adminAuth, async (req, res) => {
  const { data: payment } = await supabase.from('payments').select('*').eq('id', req.params.id).single();
  if (!payment) return res.status(404).json({ error: 'Not found' });
  
  // Update payment status
  await supabase.from('payments').update({ 
    status: 'approved', 
    processed_at: new Date().toISOString(),
    admin_note: req.body.note 
  }).eq('id', req.params.id);
  
  // Update user subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month
  
  await supabase.from('users').update({ 
    subscription: payment.plan,
    subscription_expires_at: expiresAt.toISOString()
  }).eq('id', payment.user_id);
  
  // Track referral payment
  const { data: user } = await supabase.from('users').select('referred_by').eq('id', payment.user_id).single();
  if (user?.referred_by) {
    // Increment payments count
    const { data: refLink } = await supabase.from('referral_links').select('payments').eq('code', user.referred_by).single();
    if (refLink) {
      await supabase.from('referral_links').update({ payments: (refLink.payments || 0) + 1 }).eq('code', user.referred_by);
    }
  }
  
  res.json({ success: true });
});

// Admin: Reject payment
paymentsRouter.post('/admin/reject/:id', adminAuth, async (req, res) => {
  await supabase.from('payments').update({ 
    status: 'rejected', 
    processed_at: new Date().toISOString(),
    admin_note: req.body.note 
  }).eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Payment cards management
paymentsRouter.get('/admin/cards', adminAuth, async (_, res) => {
  const { data } = await supabase.from('payment_cards').select('*').order('created_at');
  res.json(data || []);
});

paymentsRouter.post('/admin/cards', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('payment_cards').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

paymentsRouter.put('/admin/cards/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('payment_cards').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

paymentsRouter.delete('/admin/cards/:id', adminAuth, async (req, res) => {
  await supabase.from('payment_cards').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: Payment stats
paymentsRouter.get('/admin/stats', adminAuth, async (_, res) => {
  const { count: totalPayments } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'approved');
  const { count: pendingPayments } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: premiumUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription', 'premium');
  const { count: ultraUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription', 'ultra');
  
  res.json({ totalPayments, pendingPayments, totalUsers, premiumUsers, ultraUsers });
});
