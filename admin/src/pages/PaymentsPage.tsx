import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Check, X, Plus, Trash2, CreditCard, Clock } from 'lucide-react';

export default function PaymentsPage() {
  const [tab, setTab] = useState<'pending'|'all'|'cards'>('pending');
  const [payments, setPayments] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ card_number: '', card_holder: '', bank_name: '' });

  const loadPayments = () => {
    if (tab === 'pending') adminApi.getPendingPayments().then(setPayments).catch(() => {});
    else if (tab === 'all') adminApi.getAllPayments().then(setPayments).catch(() => {});
    else adminApi.getPaymentCards().then(setCards).catch(() => {});
  };
  useEffect(() => { loadPayments(); }, [tab]);

  const approve = async (id: string) => { await adminApi.approvePayment(id); loadPayments(); };
  const reject = async (id: string) => { if(confirm('Rad etish?')) { await adminApi.rejectPayment(id); loadPayments(); } };
  const addCard = async () => { await adminApi.addPaymentCard(cardForm); setShowCardForm(false); setCardForm({ card_number: '', card_holder: '', bank_name: '' }); loadPayments(); };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">To'lovlar</h1>
      <div className="flex gap-2">
        {(['pending','all','cards'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            {t === 'pending' ? 'Kutilayotgan' : t === 'all' ? 'Barchasi' : 'Kartalar'}
          </button>
        ))}
      </div>

      {tab === 'cards' ? (
        <div className="space-y-3">
          <button onClick={() => setShowCardForm(!showCardForm)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Karta</button>
          {showCardForm && (
            <div className="card space-y-3">
              <input value={cardForm.card_number} onChange={e => setCardForm({...cardForm, card_number: e.target.value})} placeholder="Karta raqami" className="input" />
              <input value={cardForm.card_holder} onChange={e => setCardForm({...cardForm, card_holder: e.target.value})} placeholder="Karta egasi" className="input" />
              <input value={cardForm.bank_name} onChange={e => setCardForm({...cardForm, bank_name: e.target.value})} placeholder="Bank nomi" className="input" />
              <button onClick={addCard} className="btn-primary text-xs">Saqlash</button>
            </div>
          )}
          {cards.map(c => (
            <div key={c.id} className="card flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <div className="flex-1">
                <p className="text-white font-mono font-medium">{c.card_number}</p>
                <p className="text-slate-400 text-xs">{c.card_holder} • {c.bank_name}</p>
              </div>
              <button onClick={() => { if(confirm('O\'chirish?')) adminApi.deletePaymentCard(c.id).then(loadPayments); }} className="btn-danger text-xs"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => (
            <div key={p.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{p.users?.first_name || p.users?.username || 'User'}</p>
                  <p className="text-slate-400 text-xs">TG: {p.users?.telegram_id} • {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.plan === 'ultra' ? 'bg-purple-500/10 text-purple-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{p.plan}</span>
                  <p className="text-white font-bold text-sm mt-1">{p.amount?.toLocaleString()} so'm</p>
                </div>
              </div>
              {p.screenshot_url && (
                <img src={p.screenshot_url.startsWith('http') ? p.screenshot_url : `data:image/jpeg;base64,${p.screenshot_url}`} alt="Screenshot" className="w-full max-h-48 rounded-xl object-contain bg-slate-900" />
              )}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${p.status === 'approved' ? 'bg-green-500/10 text-green-400' : p.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {p.status === 'approved' ? '✓ Tasdiqlangan' : p.status === 'rejected' ? '✕ Rad etilgan' : '⏳ Kutilmoqda'}
                </span>
                {p.status === 'pending' && (
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => approve(p.id)} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs hover:bg-green-500/20 flex items-center gap-1"><Check className="w-3 h-3" /> Tasdiqlash</button>
                    <button onClick={() => reject(p.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/20 flex items-center gap-1"><X className="w-3 h-3" /> Rad etish</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="text-slate-500 text-center py-8">To'lovlar yo'q</p>}
        </div>
      )}
    </div>
  );
}
