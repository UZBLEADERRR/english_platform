import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, Lock, Unlock } from 'lucide-react';

export default function ComicsPage() {
  const [comics, setComics] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', cover_url: '', description: '', is_locked: false, pages: '' });
  const [uploading, setUploading] = useState(false);

  const load = () => adminApi.getComics().then(setComics).catch(() => {});
  useEffect(() => { load(); }, []);

  const addComic = async () => {
    const pages = form.pages.split('\n').filter(Boolean);
    await adminApi.addComic({ title: form.title, cover_url: form.cover_url, description: form.description, is_locked: form.is_locked, pages });
    setShowForm(false); setForm({ title: '', cover_url: '', description: '', is_locked: false, pages: '' }); load();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadFile(file);
      setForm({...form, pages: res.url});
    } catch(err: any) { alert(err.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Komikslar</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Komiks</button>
      </div>
      {showForm && (
        <div className="card space-y-3">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Nomi" className="input" />
          <input value={form.cover_url} onChange={e => setForm({...form, cover_url: e.target.value})} placeholder="Muqova rasm URL" className="input" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Tavsif" className="input min-h-[60px]" />
          
          <div className="flex gap-2">
            <textarea value={form.pages} onChange={e => setForm({...form, pages: e.target.value})} placeholder="Sahifa rasmlar URL (har bir qatorda bitta) yoki fayl URL (pdf, cbz)" className="input min-h-[80px] font-mono text-xs flex-1" />
            <label className="btn-secondary text-xs flex items-center justify-center cursor-pointer max-h-10 mt-auto min-w-[120px]">
              {uploading ? '⏳ Kuting...' : 'Fayl Yuklash'}
              <input type="file" accept=".pdf,.cbz" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.is_locked} onChange={e => setForm({...form, is_locked: e.target.checked})} /> Qulflangan</label>
          <div className="flex gap-2"><button onClick={addComic} className="btn-primary text-xs">Saqlash</button><button onClick={() => setShowForm(false)} className="btn-secondary text-xs">Bekor</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {comics.map(c => (
          <div key={c.id} className="card space-y-2">
            {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-48 rounded-xl object-cover" />}
            <h3 className="text-white font-bold text-sm">{c.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => adminApi.updateComic(c.id, { is_locked: !c.is_locked }).then(load)} className="btn-secondary text-xs">{c.is_locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}</button>
              <button onClick={() => { if(confirm('O\'chirish?')) adminApi.deleteComic(c.id).then(load); }} className="btn-danger text-xs"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
