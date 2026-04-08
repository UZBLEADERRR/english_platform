import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2 } from 'lucide-react';

export default function AppsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', icon_url: '', app_type: 'code', html_code: '', link_url: '', is_locked: false });
  const load = () => adminApi.getApps().then(setApps).catch(() => {});
  useEffect(() => { load(); }, []);

  const addApp = async () => { await adminApi.addApp(form); setShowForm(false); setForm({ title: '', icon_url: '', app_type: 'code', html_code: '', link_url: '', is_locked: false }); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ilovalar</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Ilova</button>
      </div>
      {showForm && (
        <div className="card space-y-3">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ilova nomi" className="input" />
          <input value={form.icon_url} onChange={e => setForm({...form, icon_url: e.target.value})} placeholder="Icon URL" className="input" />
          <select value={form.app_type} onChange={e => setForm({...form, app_type: e.target.value})} className="input">
            <option value="code">Kod (HTML)</option>
            <option value="link">Link</option>
          </select>
          {form.app_type === 'code' ? (
            <textarea value={form.html_code} onChange={e => setForm({...form, html_code: e.target.value})} placeholder="HTML kod" className="input min-h-[120px] font-mono text-xs" />
          ) : (
            <input value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} placeholder="Link URL" className="input" />
          )}
          <label className="flex items-center gap-2 text-white text-sm">
            <input type="checkbox" checked={form.is_locked} onChange={e => setForm({...form, is_locked: e.target.checked})} className="rounded border-theme bg-surface text-primary" />
            Bepul userlar uchun qulflash
          </label>
          <div className="flex gap-2"><button onClick={addApp} className="btn-primary text-xs">Saqlash</button><button onClick={() => setShowForm(false)} className="btn-secondary text-xs">Bekor</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {apps.map(a => (
          <div key={a.id} className="card flex flex-col items-center gap-2 text-center">
            {a.icon_url ? <img src={a.icon_url} alt="" className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold">{a.title?.[0]}</div>}
            <h3 className="text-white text-sm font-medium">{a.title}</h3>
            <span className="text-xs text-slate-400">{a.app_type}</span>
            <button onClick={() => { if(confirm('O\'chirish?')) adminApi.deleteApp(a.id).then(load); }} className="btn-danger text-xs w-full"><Trash2 className="w-3 h-3 inline" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
