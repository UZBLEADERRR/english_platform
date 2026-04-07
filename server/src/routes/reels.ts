import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';
import { GoogleGenAI } from '@google/genai';

export const reelsRouter = Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Get all reel categories with words
reelsRouter.get('/categories', async (_, res) => {
  const { data } = await supabase.from('reel_categories').select('*, reel_words(count)').order('sort_order');
  res.json(data || []);
});

// Get words for a category
reelsRouter.get('/words/:categoryId', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  
  const { data: words } = await supabase
    .from('reel_words')
    .select('*')
    .eq('category_id', req.params.categoryId)
    .order('created_at', { ascending: true });
  
  if (userId && words) {
    const { data: knownWords } = await supabase
      .from('user_known_words')
      .select('word_id')
      .eq('user_id', userId)
      .eq('is_known', true);
    
    const knownIds = new Set(knownWords?.map(k => k.word_id) || []);
    const filtered = words.filter(w => !knownIds.has(w.id));
    return res.json(filtered);
  }
  
  res.json(words || []);
});

// Mark word as known/unknown
reelsRouter.post('/mark', async (req, res) => {
  const { user_id, word_id, is_known } = req.body;
  const { data, error } = await supabase
    .from('user_known_words')
    .upsert({ user_id, word_id, is_known }, { onConflict: 'user_id,word_id' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get user's known/unknown words
reelsRouter.get('/user-words/:userId', async (req, res) => {
  const { data: known } = await supabase
    .from('user_known_words')
    .select('*, reel_words(*)')
    .eq('user_id', req.params.userId)
    .eq('is_known', true);
  
  const { data: unknown } = await supabase
    .from('user_known_words')
    .select('*, reel_words(*)')
    .eq('user_id', req.params.userId)
    .eq('is_known', false);
  
  res.json({ known: known || [], unknown: unknown || [] });
});

// ---- Admin routes ----
reelsRouter.get('/admin/all', adminAuth, async (_, res) => {
  const { data } = await supabase.from('reel_categories').select('*, reel_words(*)').order('sort_order');
  res.json(data || []);
});

reelsRouter.post('/categories', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('reel_categories').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

reelsRouter.put('/categories/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('reel_categories').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

reelsRouter.delete('/categories/:id', adminAuth, async (req, res) => {
  await supabase.from('reel_categories').delete().eq('id', req.params.id);
  res.json({ success: true });
});

reelsRouter.post('/words', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('reel_words').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Update a single word (admin can edit image_url or word text)
reelsRouter.put('/words/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('reel_words').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

reelsRouter.delete('/words/:id', adminAuth, async (req, res) => {
  await supabase.from('reel_words').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// AI-powered word generation
reelsRouter.post('/generate-words', adminAuth, async (req, res) => {
  const { category_id, words_string } = req.body;
  if (!category_id || !words_string) return res.status(400).json({ error: 'Missing field' });

  const wordsList = words_string.split(',').map((w: string) => w.trim()).filter(Boolean);
  const results: any[] = [];

  for (const word of wordsList) {
    try {
      // Step 1: Get translation + example from Gemini
      const prompt = `For the English word "${word}":
1. Give me the Uzbek translation (a single short word/phrase).
2. Write one simple English example sentence using "${word}".
3. Describe a fun, colorful cartoon illustration that shows the meaning of "${word}" for a language learner. The description should be vivid enough to generate an image.

Reply ONLY as JSON:
{"translation": "...", "example": "...", "image_description": "..."}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction: "Output valid JSON only. No markdown.", maxOutputTokens: 300 }
      });

      const text = response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) continue;
      
      const parsed = JSON.parse(match[0]);
      const translation = parsed.translation || word;
      const example = parsed.example || `I see a ${word}.`;
      const imageDesc = parsed.image_description || `A cute cartoon of ${word}`;

      // Step 2: Generate image via Pollinations with a very specific prompt
      const imagePrompt = `Cute colorful cartoon illustration for kids learning English: ${imageDesc}. The word "${word.toUpperCase()}" is written in large bold white letters at the top center. Below it "${translation}" in green. Simple, clean, fun, educational mobile wallpaper style, 9:16 aspect ratio, no text overlap with illustration, bright pastel background.`;
      const encodedPrompt = encodeURIComponent(imagePrompt);
      const seed = Math.floor(Math.random() * 100000);
      const image_url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=720&height=1280&nologo=true&seed=${seed}`;

      const combinedWord = `${word}||${translation}||${example}`;
      
      const { data } = await supabase.from('reel_words').insert({
        category_id,
        word: combinedWord,
        image_url
      }).select().single();
      
      if (data) results.push(data);
    } catch (e) {
      console.error('Error generating word:', word, e);
    }
  }

  res.json({ success: true, generated: results });
});
