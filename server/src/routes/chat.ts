import { Router } from 'express';
import { supabase } from '../supabase.js';
import { GoogleGenAI } from '@google/genai';

export const chatRouter = Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Get user's chat sessions
chatRouter.get('/sessions/:userId', async (req, res) => {
  const { data } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('updated_at', { ascending: false });
  res.json(data || []);
});

// Get messages for a session
chatRouter.get('/messages/:sessionId', async (req, res) => {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', req.params.sessionId)
    .order('created_at');
  res.json(data || []);
});

// Create new session
chatRouter.post('/sessions', async (req, res) => {
  const { user_id } = req.body;
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id, title: 'New Chat' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  
  // Add welcome message
  await supabase.from('chat_messages').insert({
    session_id: data.id,
    role: 'model',
    text: "Assalomu alaykum! Men sizning ingliz tili o'qituvchingizman. Qanday yordam bera olaman? 🎓"
  });
  
  res.json(data);
});

// Send message and get AI response
chatRouter.post('/send', async (req, res) => {
  const { session_id, user_id, text, image_base64, image_mime_type, is_artifact_mode } = req.body;
  
  // Check user limits
  const { data: user } = await supabase.from('users').select('*').eq('id', user_id).single();
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Reset daily counter if needed
  const now = new Date();
  const resetAt = new Date(user.ai_messages_reset_at);
  if (now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000) {
    await supabase.from('users').update({ ai_messages_today: 0, ai_messages_reset_at: now.toISOString() }).eq('id', user.id);
    user.ai_messages_today = 0;
  }
  
  // Check message limits
  const limits: Record<string, number> = { free: 3, premium: 20, ultra: 999999 };
  const limit = limits[user.subscription] || 3;
  if (user.ai_messages_today >= limit) {
    return res.status(429).json({ error: 'Daily message limit reached', limit, subscription: user.subscription });
  }
  
  // Save user message
  const { data: userMsg } = await supabase
    .from('chat_messages')
    .insert({ session_id, role: 'user', text, image_url: image_base64 ? 'uploaded_image' : null })
    .select()
    .single();
  
  try {
    // Build history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at')
      .limit(20);
    
    const chatHistory = (history || []).slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));
    
    const systemInstruction = is_artifact_mode
      ? "Sen Teacher Tuxum (Ustoz Tuxum) san. Qattiqqo'l, hazilkash ingliz tili ustozi. FAQAT bitta ```html blokida HTML, CSS (Tailwind CDN) va JS yoz. Mobile-responsive bo'lishi SHART."
      : "Sen Teacher Tuxum (Ustoz Tuxum) san. Qattiqqo'l, hazilkash ingliz tili ustozi. Tushuntirishlaring aniq, hazil va qattiqqo'llik bilan. Emojilardan foydalan. Interaktiv HTML yaratma, faqat text, misollar ber.";
    
    const currentParts: any[] = [{ text: text || "Bu rasmda nima bor?" }];
    if (image_base64 && image_mime_type) {
      currentParts.push({ inlineData: { data: image_base64, mimeType: image_mime_type } });
    }
    
    const contents = [...chatHistory, { role: 'user' as const, parts: currentParts }];
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { systemInstruction }
    });
    
    const responseText = response.text || 'Kechirasiz, javob berib bo\'lmadi.';
    
    // Save model response
    const { data: modelMsg } = await supabase
      .from('chat_messages')
      .insert({ session_id, role: 'model', text: responseText })
      .select()
      .single();
    
    // Update counters
    await supabase.from('users').update({ 
      ai_messages_today: user.ai_messages_today + 1,
      ai_credits_used: user.ai_credits_used + 1
    }).eq('id', user.id);
    
    // Update session title on first message
    if ((history || []).length <= 2) {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : (text || 'Image Chat');
      await supabase.from('chat_sessions').update({ title, updated_at: now.toISOString() }).eq('id', session_id);
    } else {
      await supabase.from('chat_sessions').update({ updated_at: now.toISOString() }).eq('id', session_id);
    }
    
    res.json({ userMessage: userMsg, modelMessage: modelMsg, creditsUsed: user.ai_credits_used + 1 });
  } catch (error: any) {
    console.error('AI Error:', error);
    const errorMsg = await supabase
      .from('chat_messages')
      .insert({ session_id, role: 'model', text: 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.' })
      .select()
      .single();
    res.status(500).json({ error: error.message, modelMessage: errorMsg.data });
  }
});

// Delete session
chatRouter.delete('/sessions/:id', async (req, res) => {
  await supabase.from('chat_sessions').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Update session title
chatRouter.put('/sessions/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
