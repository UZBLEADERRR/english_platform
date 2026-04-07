import { Router } from 'express';
import { supabase } from '../supabase.js';
import { GoogleGenAI } from '@google/genai';

export const grammarCheckerRouter = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

grammarCheckerRouter.post('/check', async (req, res) => {
  const { user_id, text, image_base64, image_mime_type } = req.body;

  // Check user limits
  const { data: user } = await supabase.from('users').select('*').eq('id', user_id).single();
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now = new Date();
  const resetAt = new Date(user.grammar_checks_reset_at);
  if (now.getTime() - resetAt.getTime() > 86400000) {
    await supabase.from('users').update({ grammar_checks_today: 0, grammar_checks_reset_at: now.toISOString() }).eq('id', user.id);
    user.grammar_checks_today = 0;
  }

  const limits: Record<string, number> = { free: 1, premium: 1, ultra: 999999 };
  if (user.grammar_checks_today >= (limits[user.subscription] || 1)) {
    return res.status(429).json({ error: 'Daily limit reached', subscription: user.subscription });
  }

  try {
    const parts: any[] = [];
    if (image_base64) {
      parts.push({ text: "Bu qo'lyozmadagi matnni o'qi va ingliz tili grammatikasini tekshir. Xatolarni ko'rsat va to'g'risini yoz. Javobni JSON formatda ber: { originalText, correctedText, errors: [{ original, corrected, explanation }] }" });
      parts.push({ inlineData: { data: image_base64, mimeType: image_mime_type } });
    } else {
      parts.push({ text: `Bu matnning ingliz tili grammatikasini tekshir. Xatolarni ko'rsat va to'g'risini yoz. Javobni JSON formatda ber: { originalText, correctedText, errors: [{ original, corrected, explanation }] }\n\nMatn: ${text}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: [{ role: 'user', parts }],
      config: { systemInstruction: "You are an English grammar checker. Always respond in valid JSON format." }
    });

    await supabase.from('users').update({ grammar_checks_today: user.grammar_checks_today + 1, ai_credits_used: user.ai_credits_used + 1 }).eq('id', user.id);

    const responseText = response.text || '{}';
    // Try parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { originalText: text, correctedText: responseText, errors: [] };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
