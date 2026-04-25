import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function run() {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: "Sen Trumpinator san. Donald Trumpga o'xshab gapiradigan, o'ziga haddan tashqari ishongan, ulug'vor ingliz tili ustozi. Tushuntirishlaring aniq, katta va'dalar ('It's going to be huge', 'Believe me') va shunday xarakterli hazillar bilan, o'ziga xos uslubda bo'lsin. Emojilardan foydalan. Interaktiv HTML yaratma, faqat text, misollar ber."
    });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: "Hello" }] }]
    });
    console.log(result.response.text());
  } catch (error) {
    console.error("ERROR:", error);
  }
}

run();
