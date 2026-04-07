import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';

export default function ReferralsPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState('');
  const load = () => adminApi.getReferrals().then(setLinks).catch(() => {});
  useEffect(() => { load(); }, []);

  const addLink = async () => {
    if (!name) return;
    await adminApi.addReferral(name);
    setName(''); setShowForm(false); load();
  };

  const copyLink = (code: string) => {
    const botUsername = 'your_bot_username';
    const link = `https://t.me/${botUsername}?start=ref_${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code); setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Referral linklar</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Link</button>
      </div>

      {showForm && (
        <div className="card flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Link nomi (e.g. Instagram, Telegram)" className="input flex-1" />
          <button onClick={addLink} className="btn-primary text-xs">Yaratish</button>
        </div>
      )}

      <div className="space-y-3">
        {links.map(link => (
          <div key={link.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">{link.name}</h3>
              <button onClick={() => { if(confirm('O\'chirish?')) adminApi.deleteReferral(link.id).then(load); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-lg truncate">{link.code}</code>
              <button onClick={() => copyLink(link.code)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                {copied === link.code ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-900 rounded-xl">
                <p className="text-xl font-bold text-blue-400">{link.clicks || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">Bosishlar</p>
              </div>
              <div className="text-center p-3 bg-slate-900 rounded-xl">
                <p className="text-xl font-bold text-green-400">{link.registrations || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">Ro'yxatdan</p>
              </div>
              <div className="text-center p-3 bg-slate-900 rounded-xl">
                <p className="text-xl font-bold text-yellow-400">{link.payments || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">To'lovlar</p>
              </div>
            </div>
          </div>
        ))}
        {links.length === 0 && <p className="text-slate-500 text-center py-8">Referral linklar yo'q</p>}
      </div>
    </div>
  );
}
