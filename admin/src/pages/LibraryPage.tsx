import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', author: '', cover_url: '', pdf_url: '' });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => adminApi.get('/api/library/admin/all').then(setBooks).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadFile(file);
      setForm({ ...form, pdf_url: res.url });
    } catch (e: any) {
      alert('Yuklashda xatolik: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title) return;
    if (editId) {
      await adminApi.put(`/api/library/${editId}`, form);
    } else {
      await adminApi.post('/api/library', form);
    }
    setForm({ title: '', author: '', cover_url: '', pdf_url: '' });
    setShowForm(false); setEditId(null); load();
  };

  const startEdit = (b: any) => {
    setForm({ title: b.title, author: b.author || '', cover_url: b.cover_url || '', pdf_url: b.pdf_url || '' });
    setEditId(b.id); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">📚 Kutubxona</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: '', author: '', cover_url: '', pdf_url: '' }); }} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Qo'shish</button>
      </div>
      {showForm && (
        <div className="card space-y-3">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Kitob nomi" className="input" />
          <input value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="Muallif" className="input" />
          <input value={form.cover_url} onChange={e => setForm({...form, cover_url: e.target.value})} placeholder="Muqova rasm URL" className="input" />
          
          <div className="flex gap-2">
            <input value={form.pdf_url} onChange={e => setForm({...form, pdf_url: e.target.value})} placeholder="PDF fayl URL" className="input flex-1" />
            <label className="btn-secondary text-xs flex items-center justify-center cursor-pointer min-w-[100px]">
              {uploading ? '⏳ Kuting...' : 'PDF Yuklash'}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          <button onClick={save} className="btn-primary w-full">{editId ? 'Saqlash' : 'Qo\'shish'}</button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {books.map(b => (
          <div key={b.id} className="card relative group">
            {b.cover_url && <img src={b.cover_url} className="w-full aspect-[3/4] rounded-lg object-cover mb-2" referrerPolicy="no-referrer" />}
            <p className="text-white font-bold text-xs truncate">{b.title}</p>
            <p className="text-slate-400 text-[10px]">{b.author}</p>
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(b)} className="p-1 bg-blue-500 rounded-full"><Edit2 className="w-3 h-3 text-white" /></button>
              <button onClick={() => { if(confirm("O'chirish?")) adminApi.del(`/api/library/${b.id}`).then(load); }} className="p-1 bg-red-500 rounded-full"><Trash2 className="w-3 h-3 text-white" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
