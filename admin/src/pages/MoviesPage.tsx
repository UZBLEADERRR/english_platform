import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, Lock, Unlock, Edit2 } from 'lucide-react';

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', info_html: '', poster_url: '', video_url: '', telegram_code: '', category_id: '', is_18plus: false, is_locked: false });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  const load = () => { adminApi.getMovies().then(setMovies).catch(() => {}); adminApi.getMovieCategories().then(setCategories).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await adminApi.uploadVideo(file);
      setForm({...form, video_url: res.iframe || res.url}); // Prefer iframe embed logic
    } catch(e: any) { alert(e.message); }
    finally { setUploadingVideo(false); }
  };

  const addMovie = async () => { 
    if (!form.title) return alert('Kino nomini kiriting!');
    if (!form.category_id) return alert('Iltimos, avval kategoriyani tanlang (agar yo\'q bo\'lsa yarating).');
    
    if (editId) {
      await adminApi.updateMovie(editId, form);
    } else {
      await adminApi.addMovie(form); 
    }
    setShowForm(false); 
    setEditId(null);
    setForm({ title: '', description: '', info_html: '', poster_url: '', video_url: '', telegram_code: '', category_id: '', is_18plus: false, is_locked: false }); 
    load(); 
  };
  
  const startEdit = (m: any) => {
    setForm({ title: m.title, description: m.description || '', info_html: m.info_html || '', poster_url: m.poster_url || '', video_url: m.video_url || '', telegram_code: m.telegram_code || '', category_id: m.category_id || '', is_18plus: m.is_18plus, is_locked: m.is_locked });
    setEditId(m.id);
    setShowForm(true);
  };
  const deleteMovie = async (id: string) => { if(!confirm('O\'chirish?')) return; await adminApi.deleteMovie(id); load(); };
  const toggleLock = async (m: any) => { await adminApi.updateMovie(m.id, { is_locked: !m.is_locked }); load(); };
  const addCategory = async () => { if(!catName) return; await adminApi.addMovieCategory({ name: catName }); setCatName(''); setShowCatForm(false); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-white">Kinolar</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCatForm(!showCatForm)} className="btn-secondary text-xs">+ Kategoriya</button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Kino</button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 py-2">
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-theme">
              <span className="text-sm font-medium text-main">{c.name}</span>
              <button onClick={() => {
                const newName = prompt('Yangi nom:', c.name);
                if (newName && newName !== c.name) {
                  adminApi.updateMovieCategory(c.id, { name: newName }).then(load);
                }
              }} className="text-blue-400 hover:text-blue-300 ml-1"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => {
                if(confirm("Rostan ham o'chirasizmi? Ushbu kategoriyadagi kinolar kategoriyasiz qoladi.")) adminApi.deleteMovieCategory(c.id).then(load);
              }} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {showCatForm && (
        <div className="card flex gap-2">
          <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Kategoriya nomi" className="input flex-1" />
          <button onClick={addCategory} className="btn-primary text-xs">Saqlash</button>
        </div>
      )}
      
      {showForm && (
        <div className="card space-y-3">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Nomi" className="input" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Qisqa tavsif" className="input min-h-[60px]" />
          <textarea value={form.info_html} onChange={e => setForm({...form, info_html: e.target.value})} placeholder="To'liq interaktiv HTML tavsif (ixtiyoriy)" className="input min-h-[100px] font-mono text-xs" />
          <input value={form.poster_url} onChange={e => setForm({...form, poster_url: e.target.value})} placeholder="Poster URL" className="input" />
          
          <div className="flex gap-2">
            <input value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} placeholder="Video URL (yoki fayl yuklang)" className="input flex-1" />
            <label className="btn-secondary text-xs flex items-center justify-center cursor-pointer min-w-[100px]">
              {uploadingVideo ? '⏳ Kuting...' : 'Video Yuklash'}
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
            </label>
          </div>

          <input value={form.telegram_code} onChange={e => setForm({...form, telegram_code: e.target.value})} placeholder="Telegram kodi (bot orqali ko'rish uchun)" className="input" />

          <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="input">
            <option value="">Kategoriya tanlang</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.is_18plus} onChange={e => setForm({...form, is_18plus: e.target.checked})} /> 18+</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.is_locked} onChange={e => setForm({...form, is_locked: e.target.checked})} /> Qulflangan</label>
          </div>
          <div className="flex gap-2"><button onClick={addMovie} className="btn-primary text-xs">Saqlash</button><button onClick={() => setShowForm(false)} className="btn-secondary text-xs">Bekor</button></div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {movies.map(m => (
          <div key={m.id} className="card space-y-2">
            {m.poster_url && <img src={m.poster_url} alt="" className="w-full h-40 rounded-xl object-cover" />}
            <h3 className="text-white font-bold text-sm">{m.title}</h3>
            <p className="text-slate-400 text-xs line-clamp-2">{m.description}</p>
            {m.telegram_code && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">TG: {m.telegram_code}</span>}
            <div className="flex items-center gap-2 flex-wrap">
              {m.is_18plus && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">18+</span>}
              <span className={`px-2 py-0.5 rounded text-xs ${m.is_locked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{m.is_locked ? 'Qulflangan' : 'Ochiq'}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => toggleLock(m)} className="btn-secondary text-xs flex items-center gap-1 hover:text-white" title={m.is_locked ? "Qulfni ochish" : "Qulflash"}>{m.is_locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}</button>
              <button onClick={() => startEdit(m)} className="btn-secondary text-xs flex items-center gap-1 hover:text-blue-400" title="Tahrirlash"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => deleteMovie(m.id)} className="btn-danger text-xs flex items-center gap-1" title="O'chirish"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
