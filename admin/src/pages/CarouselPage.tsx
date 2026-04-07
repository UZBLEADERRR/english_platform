import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function CarouselPage() {
  const [images, setImages] = useState<any[]>([]);
  const [form, setForm] = useState({ image_url: '', title: '', subtitle: '', link: '' });
  const [adding, setAdding] = useState(false);

  const load = () => adminApi.getCarousel().then(setImages).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.image_url) return;
    await adminApi.addCarouselImage(form);
    setForm({ image_url: '', title: '', subtitle: '', link: '' });
    setAdding(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('O\'chirilsinmi?')) return;
    await adminApi.deleteCarouselImage(id); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Karusel rasmlari</h1>
        <button onClick={() => setAdding(!adding)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Qo'shish</button>
      </div>

      {adding && (
        <div className="card space-y-3">
          <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="Rasm URL" className="input" />
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Sarlavha (ixtiyoriy)" className="input" />
          <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="Qo'shimcha matn (ixtiyoriy)" className="input" />
          <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="Link (ixtiyoriy)" className="input" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary">Saqlash</button>
            <button onClick={() => setAdding(false)} className="btn-secondary">Bekor</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {images.map((img) => (
          <div key={img.id} className="card flex items-center gap-4">
            <GripVertical className="w-5 h-5 text-slate-500 cursor-grab" />
            <img src={img.image_url} alt="" className="w-24 h-16 rounded-lg object-cover bg-slate-800" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{img.title || 'Sarlavhasiz'}</p>
              <p className="text-slate-400 text-xs truncate">{img.image_url}</p>
            </div>
            <button onClick={() => handleDelete(img.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {images.length === 0 && <p className="text-slate-500 text-center py-8">Rasmlar yo'q</p>}
      </div>
    </div>
  );
}
