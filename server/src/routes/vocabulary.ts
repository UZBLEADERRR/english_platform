import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const vocabularyRouter = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get vocabulary words for a topic
vocabularyRouter.get('/words/:topicId', async (req, res) => {
  const { data } = await supabase
    .from('vocabulary_words')
    .select('*')
    .eq('topic_id', req.params.topicId)
    .order('sort_order');
  res.json(data || []);
});

// Admin: add words in bulk (paste format: english - uzbek per line)
vocabularyRouter.post('/generate', adminAuth, async (req, res) => {
  const { topic_id, words_text } = req.body;
  if (!topic_id || !words_text) return res.status(400).json({ error: 'Missing fields' });

  // Parse lines: "english - uzbek" format
  const lines = words_text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const wordPairs = lines.map((line: string) => {
    const parts = line.split(/[-–—]/).map((p: string) => p.trim());
    return { english: parts[0] || '', uzbek: parts[1] || '' };
  }).filter((w: any) => w.english);

  const results: any[] = [];

  // Process words in batches to avoid rate limiting
  for (let i = 0; i < wordPairs.length; i++) {
    const { english, uzbek } = wordPairs[i];
    
    try {
      const prompt = `For the English word/phrase "${english}":
1. "example": Create 1 real-life example sentence in English using "${english}".
2. "example_translation": Provide the exact Uzbek translation of that example sentence.
3. "synonyms": Array of 2-3 English synonyms (empty array if not applicable).
4. "antonyms": Array of 2-3 English antonyms (empty array if not applicable).
5. "uzbek": The Uzbek translation of "${english}" (use "${uzbek}" if provided, otherwise translate it).

Reply ONLY as valid JSON with this exact structure:
{
  "example": "English sentence",
  "example_translation": "Uzbek sentence",
  "synonyms": ["word1", "word2"],
  "antonyms": ["word1", "word2"],
  "uzbek": "translated word"
}`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        systemInstruction: "Output valid JSON only. No markdown."
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = result.response.text() || '';
      const match = text.match(/\{[\s\S]*\}/);
      let parsed = { example: '', example_translation: '', synonyms: [], antonyms: [], uzbek: uzbek };
      
      if (match) {
        try { parsed = { ...parsed, ...JSON.parse(match[0]) }; } catch(e) {}
      }

      const { data } = await supabase.from('vocabulary_words').insert({
        topic_id,
        english: english,
        uzbek: parsed.uzbek || uzbek,
        example: parsed.example,
        example_translation: parsed.example_translation || '',
        synonyms: parsed.synonyms || [],
        antonyms: parsed.antonyms || [],
        sort_order: i,
      }).select().single();

      if (data) results.push(data);
    } catch (e) {
      console.error('Error processing word:', english, e);
      // Still insert the word without AI data
      const { data } = await supabase.from('vocabulary_words').insert({
        topic_id,
        english,
        uzbek,
        example: '',
        example_translation: '',
        synonyms: [],
        antonyms: [],
        sort_order: i,
      }).select().single();
      if (data) results.push(data);
    }
  }

  res.json({ success: true, words: results, count: results.length });
});

// Admin: delete a word
vocabularyRouter.delete('/words/:id', adminAuth, async (req, res) => {
  await supabase.from('vocabulary_words').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: update a word
vocabularyRouter.put('/words/:id', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('vocabulary_words').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// Translate text (Movie detail page uses this)
vocabularyRouter.post('/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) return res.status(400).json({ error: 'Missing text or targetLang' });

  const langNames: Record<string, string> = {
    en: 'English',
    uz: 'Uzbek',
    ru: 'Russian'
  };

  const language = langNames[targetLang] || 'Uzbek';

  try {
    const prompt = `Translate the following text to ${language}. Return ONLY the direct translation, without any explanations, formatting, warnings, or quotes. Here is the text:
"${text}"`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });
    const result = await model.generateContent(prompt);
    const translation = result.response.text()?.trim() || '';
    res.json({ translation });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Tarjima qilishda xatolik yuz berdi' });
  }
});
