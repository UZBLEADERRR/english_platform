import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Save, CreditCard } from 'lucide-react';

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  currency: string;
  daily_messages: number;
  daily_grammar: number;
  max_artifacts: number;
  features: string;
}

const defaultPlans: PlanConfig[] = [
  { id: 'free', name: 'Bepul', price: 0, currency: "so'm", daily_messages: 3, daily_grammar: 1, max_artifacts: 1, features: 'Asosiy chatbot, 1 ta ilova' },
  { id: 'premium', name: 'Premium', price: 29000, currency: "so'm", daily_messages: 20, daily_grammar: 5, max_artifacts: 1, features: 'AI Chat 20 msg, Grammar 5x, Kinolar, Comics, Darslar' },
  { id: 'ultra', name: 'Ultra', price: 49000, currency: "so'm", daily_messages: 999999, daily_grammar: 999999, max_artifacts: 999999, features: 'CHEKSIZ hammasi, Beta imtiyozi, Ultra badge' },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanConfig[]>(defaultPlans);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.get('/api/admin/pricing').then((data: any) => {
      if (data && data.length) setPlans(data);
    }).catch(() => {});
  }, []);

  const updatePlan = (index: number, field: keyof PlanConfig, value: any) => {
    setPlans(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.post('/api/admin/pricing', { plans });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Xatolik yuz berdi');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5" /> Narxlarni Boshqarish</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex items-center gap-1">
          <Save className="w-3 h-3" /> {saving ? 'Saqlanmoqda...' : saved ? '✅ Saqlandi!' : 'Saqlash'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, idx) => (
          <div key={plan.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{plan.id === 'free' ? '🆓' : plan.id === 'premium' ? '⭐' : '💎'} {plan.name}</h3>
              <span className="text-xs text-slate-400">{plan.id}</span>
            </div>

            <div>
              <label className="text-xs text-slate-400">Narx ({plan.currency})</label>
              <input type="number" value={plan.price} onChange={e => updatePlan(idx, 'price', parseInt(e.target.value) || 0)}
                className="input" disabled={plan.id === 'free'} />
            </div>

            <div>
              <label className="text-xs text-slate-400">Kunlik AI xabarlar limiti</label>
              <input type="number" value={plan.daily_messages} onChange={e => updatePlan(idx, 'daily_messages', parseInt(e.target.value) || 0)}
                className="input" />
            </div>

            <div>
              <label className="text-xs text-slate-400">Kunlik Grammar tekshirish limiti</label>
              <input type="number" value={plan.daily_grammar} onChange={e => updatePlan(idx, 'daily_grammar', parseInt(e.target.value) || 0)}
                className="input" />
            </div>

            <div>
              <label className="text-xs text-slate-400">Artifact yaratish limiti</label>
              <input type="number" value={plan.max_artifacts} onChange={e => updatePlan(idx, 'max_artifacts', parseInt(e.target.value) || 0)}
                className="input" />
            </div>

            <div>
              <label className="text-xs text-slate-400">Xususiyatlar (tavsif)</label>
              <textarea value={plan.features} onChange={e => updatePlan(idx, 'features', e.target.value)}
                className="input min-h-[60px] text-xs" />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-sm font-bold text-white mb-2">📊 Joriy cheklovlar xulosa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead><tr className="text-slate-400 border-b border-[#1e1e30]">
              <th className="py-2 px-3">Tarif</th>
              <th className="py-2 px-3">Narx</th>
              <th className="py-2 px-3">AI Chat</th>
              <th className="py-2 px-3">Grammar</th>
              <th className="py-2 px-3">Artifact</th>
            </tr></thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="text-white border-b border-[#1e1e30]/50">
                  <td className="py-2 px-3 font-bold">{p.name}</td>
                  <td className="py-2 px-3">{p.price > 0 ? `${p.price.toLocaleString()} ${p.currency}/oy` : 'Bepul'}</td>
                  <td className="py-2 px-3">{p.daily_messages >= 999999 ? '♾️' : `${p.daily_messages}/kun`}</td>
                  <td className="py-2 px-3">{p.daily_grammar >= 999999 ? '♾️' : `${p.daily_grammar}/kun`}</td>
                  <td className="py-2 px-3">{p.max_artifacts >= 999999 ? '♾️' : p.max_artifacts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
