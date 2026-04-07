import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Check, Upload, Loader2, Crown } from 'lucide-react';
import { cn } from '../Layout';

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
  }, []);

  const plans = [
    {
      id: 'premium' as const, name: 'Premium', price: '29,000 so\'m/oy', color: 'from-yellow-500 to-orange-500',
      features: ['Grammar darslar ochiq', 'Comics ochiq (ruxsat berilganlar)', 'Kinolar ochiq (ruxsat berilganlar)', 'AI Chat: 20 ta xabar/kun', 'Grammar Checker: 1/kun', 'Tips ochiq'],
    },
    {
      id: 'ultra' as const, name: 'Ultra', price: '49,000 so\'m/oy', color: 'from-purple-500 to-pink-500',
      features: ['Barcha darslar ochiq', 'Barcha comics ochiq', 'Barcha kinolar ochiq', 'AI Chat: cheksiz', 'Grammar Checker: cheksiz', 'Reading, Writing, Listening, Speaking ochiq', 'Barcha premium kontentlar'],
    },
  ];

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
        amount: selectedPlan === 'premium' ? 29000 : 49000,
      });
      setSubmitted(true);
    } catch {} finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in p-4">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4"><Check className="w-10 h-10 text-green-500" /></div>
        <h2 className="text-xl font-bold text-main mb-2">To'lov yuborildi!</h2>
        <p className="text-muted text-sm mb-6">Admin tekshirgandan so'ng {selectedPlan} aktivlashadi</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium">Bosh sahifaga</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-elevated"><ArrowLeft className="w-5 h-5 text-main" /></button>
        <h1 className="text-xl font-bold text-main">Tarif tanlang</h1>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map(plan => (
          <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
            className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all", selectedPlan === plan.id ? "border-primary shadow-lg" : "border-theme")}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center", plan.color)}>
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-main">{plan.name}</h3>
                  <p className="text-sm text-primary font-medium">{plan.price}</p>
                </div>
              </div>
              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", selectedPlan === plan.id ? "border-primary bg-primary" : "border-theme")}>
                {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Payment Card */}
      {cards.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-main text-sm">To'lov kartasi</h3>
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
        <h3 className="font-bold text-main text-sm">To'lov screenshotini yuklang</h3>
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
        className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        To'lovni yuborish
      </button>
    </div>
  );
}
