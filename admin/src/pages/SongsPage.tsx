import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function SongsPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', artist: '', cover_url: '', media_type: 'audio', media_url: '', lyrics_html: '' });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => adminApi.get('/api/songs/admin/all').then(setSongs).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title) return;
    if (editId) {
      await adminApi.put(`/api/songs/${editId}`, form);
    } else {
      await adminApi.post('/api/songs', form);
    }
    setForm({ title: '', artist: '', cover_url: '', media_type: 'audio', media_url: '', lyrics_html: '' });
    setShowForm(false); setEditId(null); load();
  };

  const startEdit = (s: any) => {
    setForm({ title: s.title, artist: s.artist || '', cover_url: s.cover_url || '', media_type: s.media_type || 'audio', media_url: s.media_url || '', lyrics_html: s.lyrics_html || '' });
    setEditId(s.id); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">🎵 Qo'shiqlar</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: '', artist: '', cover_url: '', media_type: 'audio', media_url: '', lyrics_html: '' }); }} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Qo'shish</button>
      </div>
      {showForm && (
        <div className="card space-y-3">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Qo'shiq nomi" className="input" />
          <input value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} placeholder="Artist" className="input" />
          <input value={form.cover_url} onChange={e => setForm({...form, cover_url: e.target.value})} placeholder="Cover rasm URL" className="input" />
          <select value={form.media_type} onChange={e => setForm({...form, media_type: e.target.value})} className="input">
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>
          <input value={form.media_url} onChange={e => setForm({...form, media_url: e.target.value})} placeholder="Audio/Video URL" className="input" />
          <textarea value={form.lyrics_html} onChange={e => setForm({...form, lyrics_html: e.target.value})} placeholder="Lyrics HTML kodi (Webview uchun)" className="input min-h-[120px]" />
          <button onClick={save} className="btn-primary w-full">{editId ? 'Saqlash' : 'Qo\'shish'}</button>
        </div>
      )}
      <div className="space-y-2">
        {songs.map(s => (
          <div key={s.id} className="card flex items-center gap-3">
            {s.cover_url && <img src={s.cover_url} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{s.title}</p>
              <p className="text-xs text-slate-400">{s.artist} • {s.media_type}</p>
            </div>
            <button onClick={() => startEdit(s)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => { if(confirm("O'chirish?")) adminApi.del(`/api/songs/${s.id}`).then(load); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
