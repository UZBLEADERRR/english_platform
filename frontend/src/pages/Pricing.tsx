import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Check, Upload, Loader2, Crown, Star, Sparkles, Zap, Bot, BookOpen, Film, Shield } from 'lucide-react';
import { cn } from '../utils';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [cards, setCards] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'ultra'>('premium');
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [screenshot, setScreenshot] = useState<{ url: string; base64: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getPaymentCards().then(c => { setCards(c); if (c.length) setSelectedCard(c[0].id); }).catch(() => {});
    // Load dynamic pricing from API
    api.get('/api/admin/pricing/public').then((data: any) => {
      if (data && data.length) {
        const premiumConfig = data.find((p: any) => p.id === 'premium');
        const ultraConfig = data.find((p: any) => p.id === 'ultra');
        if (premiumConfig) {
          setPlans(prev => prev.map(p => p.id === 'premium' ? { ...p, price: `${premiumConfig.price.toLocaleString()} ${premiumConfig.currency || "so'm"}/oy`, apiPrice: premiumConfig.price } : p));
        }
        if (ultraConfig) {
          setPlans(prev => prev.map(p => p.id === 'ultra' ? { ...p, price: `${ultraConfig.price.toLocaleString()} ${ultraConfig.currency || "so'm"}/oy`, apiPrice: ultraConfig.price } : p));
        }
      }
    }).catch(() => {});
  }, []);

  const [plans, setPlans] = useState([
    {
      id: 'premium' as const, name: '⭐ Premium', price: "29,000 so'm/oy", apiPrice: 29000, color: 'from-yellow-500 to-orange-500',
      emoji: '🏆',
      tagline: "Ingliz tilini o'rganishning eng yaxshi yo'li!",
      features: [
        '🤖 AI Teacher — Kuniga 20 ta super xabar! Shaxsiy ustoz 24/7 sizning xizmatingizda',
        '📱 AI Ilovalar yaratish — 1 ta bepul ilova. Kodlash, o\'yin, kalkulyator — AI yaratadi!',
        '✍️ Grammar Checker — Kuniga 5 marta! Yozganlarning 100% xatosiz bo\'lsin',
        '🎬 Premium kinolar — Ingliz tilida kino ko\'rib o\'rganing',
        '📚 Barcha grammar darslar ochiq — Boshlang\'ichdan oliyga',
        '📖 Comics ochiq — Qiziqarli hikoyalar bilan o\'rganing',
        '💡 Maslahatlar va Tipslar — Professional tavsiyalar',
      ],
    },
    {
      id: 'ultra' as const, name: '💎 Ultra', price: "49,000 so'm/oy", apiPrice: 49000, color: 'from-purple-500 to-pink-500',
      emoji: '👑',
      tagline: 'CHEKSIZ IMKONIYATLAR — Eng yuqori daraja!',
      features: [
        '🤖 AI Teacher — CHEKSIZ xabarlar! Istagan vaqt, istagan savol',
        '📱 AI Ilovalar yaratish — CHEKSIZ! O\'yin, dastur, sayt — hammasi!',
        '✍️ Grammar Checker — CHEKSIZ! Har qanday matnni tekshiring',
        '🎬 BARCHA kinolar ochiq — 18+ kontentlar ham barchasi',
        '📚 BARCHA darslar ochiq — Reading, Writing, Listening, Speaking',
        '📖 BARCHA comics ochiq — Maxfiy kontentlar ham',
        '🎵 Qo\'shiqlar va materiallar — To\'liq kutubxona',
        '🔥 Yangi xususiyatlar BIRINCHI sizga — Beta tester imtiyozi',
        '👑 Ultra badge — Profilizda maxsus nishon',
      ],
    },
  ]);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setScreenshot({ url: URL.createObjectURL(file), base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user || !screenshot || !selectedCard) return;
    setSubmitting(true);
    try {
      await api.submitPayment({
        user_id: user.id, plan: selectedPlan, screenshot_url: screenshot.base64, card_id: selectedCard,
        amount: plans.find(p => p.id === selectedPlan)?.apiPrice || (selectedPlan === 'premium' ? 29000 : 49000),
      });
      setSubmitted(true);
    } catch (e: any) { alert(e.message || 'Xatolik yuz berdi'); } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center page-enter p-4">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4"><Check className="w-10 h-10 text-green-500" /></div>
        <h2 className="text-xl font-bold text-main mb-2">To'lov yuborildi! 🎉</h2>
        <p className="text-muted text-sm mb-6">Admin tekshirgandan so'ng {selectedPlan} aktivlashadi</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium">Bosh sahifaga</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter max-w-lg mx-auto">

      {/* Hero */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-extrabold text-main mb-2">Ingliz tilini SUPER tez o'rganing! 🚀</h2>
        <p className="text-muted text-sm">AI ustoz, interaktiv darslar, kinolar, ilovalar — hammasi bir joyda</p>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map(plan => (
          <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
            className={cn("w-full p-5 rounded-2xl border-2 text-left transition-all", selectedPlan === plan.id ? "border-primary shadow-lg shadow-primary/20" : "border-theme")}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{plan.emoji}</span>
                <div>
                  <h3 className="font-extrabold text-main text-lg">{plan.name}</h3>
                  <p className="text-primary font-bold">{plan.price}</p>
                </div>
              </div>
              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", selectedPlan === plan.id ? "border-primary bg-primary" : "border-theme")}>
                {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <p className="text-xs text-muted italic mb-3">{plan.tagline}</p>
            <ul className="space-y-2">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-main">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> <span>{f}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Free comparison */}
      <div className="p-4 bg-surface border border-theme rounded-2xl">
        <h4 className="font-bold text-main mb-2 text-sm">🆓 Bepul tarifda:</h4>
        <ul className="space-y-1 text-xs text-muted">
          <li>• AI Chat: kuniga faqat 3 ta xabar</li>
          <li>• AI Ilova yaratish: faqat 1 marta</li>
          <li>• Grammar Checker: kuniga 1 marta</li>
          <li>• Kinolar va Comics: qulflangan ❌</li>
          <li>• Premium darslar: qulflangan ❌</li>
        </ul>
      </div>

      {/* Payment Card */}
      {cards.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-main text-sm">💳 To'lov kartasi</h3>
          {cards.map(card => (
            <div key={card.id} onClick={() => setSelectedCard(card.id)}
              className={cn("p-3 rounded-xl border cursor-pointer transition-all", selectedCard === card.id ? "border-primary bg-primary/5" : "border-theme")}>
              <p className="font-mono font-bold text-main">{card.card_number}</p>
              <p className="text-xs text-muted">{card.card_holder} • {card.bank_name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot Upload */}
      <div className="space-y-2">
        <h3 className="font-bold text-main text-sm">📸 To'lov screenshotini yuklang</h3>
        {screenshot ? (
          <div className="relative">
            <img src={screenshot.url} alt="" className="w-full rounded-xl border border-theme" />
            <button onClick={() => setScreenshot(null)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full text-xs">✕</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-theme rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 text-muted mb-2" />
            <span className="text-sm text-muted">Screenshot yuklash</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
          </label>
        )}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!screenshot || submitting}
        className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 mb-8">
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        🚀 To'lovni yuborish
      </button>
    </div>
  );
}
