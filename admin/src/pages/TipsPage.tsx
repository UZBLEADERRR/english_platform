import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2 } from 'lucide-react';

export default function TipsPage() {
  const [tips, setTips] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', cover_image_url: '', html_code: '' });
  const load = () => adminApi.getTips().then(setTips).catch(() => {});
  useEffect(() => { load(); }, []);

  const addTip = async () => { await adminApi.addTip(form); setShowForm(false); setForm({ title: '', cover_image_url: '', html_code: '' }); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Maslahatlar</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Maslahat</button>
      </div>
      {showForm && (
        <div className="card space-y-3">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Sarlavha" className="input" />
          <input value={form.cover_image_url} onChange={e => setForm({...form, cover_image_url: e.target.value})} placeholder="Muqova rasm URL" className="input" />
          <textarea value={form.html_code} onChange={e => setForm({...form, html_code: e.target.value})} placeholder="HTML kod (WebView)" className="input min-h-[120px] font-mono text-xs" />
          <div className="flex gap-2"><button onClick={addTip} className="btn-primary text-xs">Saqlash</button><button onClick={() => setShowForm(false)} className="btn-secondary text-xs">Bekor</button></div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map(t => (
          <div key={t.id} className="card flex gap-3">
            {t.cover_image_url && <img src={t.cover_image_url} alt="" className="w-20 h-16 rounded-lg object-cover" />}
            <div className="flex-1"><h3 className="text-white font-medium text-sm">{t.title}</h3></div>
            <button onClick={() => { if(confirm('O\'chirish?')) adminApi.deleteTip(t.id).then(load); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
