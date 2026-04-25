import { Router } from 'express';
import { supabase } from '../supabase.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const chatRouter = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

// Update a message (for artifact editing)
chatRouter.put('/messages/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get user artifacts (AI generated HTML apps)
chatRouter.get('/artifacts/:userId', async (req, res) => {
  const { data: sessions } = await supabase.from('chat_sessions').select('id').eq('user_id', req.params.userId);
  if (!sessions || !sessions.length) return res.json([]);
  
  const sessionIds = sessions.map((s: any) => s.id);
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('role', 'model')
    .like('text', '%```html%')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false });
    
  res.json(messages || []);
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

// Token tracking helper
function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

// Get token usage stats
chatRouter.get('/token-stats', async (_, res) => {
  const { data } = await supabase.from('token_usage').select('*').order('created_at', { ascending: false }).limit(100);
  
  let totalInput = 0, totalOutput = 0;
  (data || []).forEach((row: any) => {
    totalInput += row.input_tokens || 0;
    totalOutput += row.output_tokens || 0;
  });
  
  // Pricing: input $1/1M tokens, output $5/1M tokens
  const inputCost = (totalInput / 1_000_000) * 1;
  const outputCost = (totalOutput / 1_000_000) * 5;
  
  res.json({
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    inputCostUSD: inputCost.toFixed(4),
    outputCostUSD: outputCost.toFixed(4),
    totalCostUSD: (inputCost + outputCost).toFixed(4),
    recentUsage: data || []
  });
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

  // Check artifact limits (Free limit: 1 time artifact generation)
  if (is_artifact_mode) {
    const artifactLimits: Record<string, number> = { free: 1, premium: 1, ultra: 999999 };
    const artifactLimit = artifactLimits[user.subscription] || 1;
    if (user.artifacts_created >= artifactLimit) {
      if (user.subscription === 'free') {
        return res.status(403).json({ error: 'Artifact limit reached', message: 'Bepul tarifda faqat 1 ta ilova yaratish mumkin. Iltimos Premium sotib oling.' });
      }
    }
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
    
    let chatHistory = (history || []).slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));
    
    // Google GenAI requires history to start with a 'user' message!
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.unshift({ role: 'user', parts: [{ text: 'Assalomu alaykum' }] });
    }
    
    const systemInstruction = is_artifact_mode
      ? "Sen zo'r dasturchisan. Foydalanuvchining so'roviga asosan bitta web ilova yoki o'yin (interaktiv UI) yaratib berasan. FAQATGINA bitta ```html blokida HTML kodingni ber. Barcha CSS(Tailwind orqali) va JS yozilgan bo'lsin. Mobile-responsive bo'lishi SHART. Hech qanday tushuntirish matni YOZMA!! Oldin eslatma ham yozma. Boshlanishi va tugashi shunday bo'lsin: ```html <html>...</html> ```"
      : "Sen Teacher Tuxum (Ustoz Tuxum) san. Qattiqqo'l, hazilkash ingliz tili ustozi. Tushuntirishlaring aniq, hazil va qattiqqo'llik bilan. Emojilardan foydalan. Interaktiv HTML yaratma, faqat text, misollar ber.";
    
    const currentParts: any[] = [{ text: text || "Bu rasmda nima bor?" }];
    if (image_base64 && image_mime_type) {
      currentParts.push({ inlineData: { data: image_base64, mimeType: image_mime_type } });
    }
    
    const contents = [...chatHistory, { role: 'user' as const, parts: currentParts }];
    const fullInputText = contents.map(c => c.parts.map((p: any) => p.text || '').join('')).join('\n') + (typeof systemInstruction === 'string' ? systemInstruction : '');
    const inputTokens = estimateTokens(fullInputText);
    
    const hasImage = image_base64 && image_mime_type;
    const modelName = 'gemini-3-flash-preview';
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemInstruction as string
    });
    
    const result = await model.generateContent({
      contents,
    });
    
    const responseText = result.response.text() || 'Kechirasiz, javob berib bo\'lmadi.';
    const outputTokens = estimateTokens(responseText);
    
    // Save token usage
    try {
      await supabase.from('token_usage').insert({
        user_id,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model: 'gemini-3-flash-preview',
        endpoint: 'chat'
      });
    } catch (e) {
      // token_usage table might not exist yet, ignore
    }
    
    // Save model response
    const { data: modelMsg } = await supabase
      .from('chat_messages')
      .insert({ session_id, role: 'model', text: responseText })
      .select()
      .single();
    
    // Update counters
    const updateData: any = { 
      ai_messages_today: user.ai_messages_today + 1,
      ai_credits_used: user.ai_credits_used + 1
    };
    if (is_artifact_mode) {
      updateData.artifacts_created = (user.artifacts_created || 0) + 1;
    }
    
    await supabase.from('users').update(updateData).eq('id', user.id);
    
    // Update session title on first message
    if ((history || []).length <= 2) {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : (text || 'Image Chat');
      await supabase.from('chat_sessions').update({ title, updated_at: now.toISOString() }).eq('id', session_id);
    } else {
      await supabase.from('chat_sessions').update({ updated_at: now.toISOString() }).eq('id', session_id);
    }
    
    res.json({ 
      userMessage: userMsg, 
      modelMessage: modelMsg, 
      creditsUsed: user.ai_credits_used + 1,
      tokens: { input: inputTokens, output: outputTokens }
    });
  } catch (error: any) {
    console.error('AI ERROR DETAILS:', error);
    const errorMessage = error.message || 'Unknown AI error';
    
    const { data: errorMsg } = await supabase
      .from('chat_messages')
      .insert({ session_id, role: 'model', text: `Xatolik yuz berdi: ${errorMessage}. Iltimos qaytadan urinib ko'ring.` })
      .select()
      .single();
    res.status(500).json({ error: errorMessage, modelMessage: errorMsg });
  }
});

// Delete session
chatRouter.delete('/sessions/:id', async (req, res) => {
  await supabase.from('chat_messages').delete().eq('session_id', req.params.id);
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
