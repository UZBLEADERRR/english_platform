import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Save, Upload } from 'lucide-react';

const fallbackCategories = [
  { id: 'grammar', custom_name: 'Grammar', image_url: '' },
  { id: 'vocabulary', custom_name: 'Vocabulary', image_url: '' },
  { id: 'reading', custom_name: 'Reading', image_url: '' },
  { id: 'listening', custom_name: 'Listening', image_url: '' },
  { id: 'writing', custom_name: 'Writing', image_url: '' },
  { id: 'speaking', custom_name: 'Speaking', image_url: '' },
  { id: 'movies', custom_name: 'Movies', image_url: '' },
  { id: 'comics', custom_name: 'Comics', image_url: '' },
  { id: 'songs', custom_name: 'Songs', image_url: '' },
  { id: 'library', custom_name: 'Library', image_url: '' },
  { id: 'apps', custom_name: 'Ilovalar', image_url: '' },
  { id: 'reels', custom_name: 'Reels', image_url: '' },
  { id: 'ai-chat', custom_name: 'Virtual Teacher', image_url: '' },
  { id: 'grammar_checker', custom_name: 'Grammar Checker', image_url: '' },
  { id: 'tips', custom_name: 'Tips', image_url: '' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>(fallbackCategories);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = () => {
    adminApi.getCategories().then(data => {
      const merged = fallbackCategories.map(fb => {
        const found = data.find((d: any) => d.id === fb.id);
        return found || fb;
      });
      setCategories(merged);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async (id: string, data: any) => {
    await adminApi.updateCategory(id, data);
    load();
  };

  const handleFileUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const res = await adminApi.uploadVideo(file); // uploadVideo uploads to generic bunny or storage and returns URL
      handleUpdate(id, { image_url: res.url });
    } catch(e) {
      alert('Xatolik yuz berdi');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Bosh Sahifa Bo'limlari</h1>
      <p className="text-sm text-slate-400">Pastda ko'rsatilgan bo'limlarning rasm va nomlarini tahrirlashingiz mumkin. O'zgarishlar darhol saqlanadi.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="card space-y-3">
            <div className="flex items-center gap-3">
              {cat.image_url ? (
                <img src={cat.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-surface" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center text-xs text-muted font-medium border border-theme">Rasm yo'q</div>
              )}
              <div className="flex-1">
                <p className="text-white font-bold text-sm bg-surface/50 px-2 py-1 rounded inline-block">{cat.id}</p>
                <p className="text-slate-400 text-xs mt-1">{cat.custom_name}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400">Rasm havola (URL) yoki fayl yuklang:</label>
              <div className="flex gap-2">
                <input defaultValue={cat.image_url || ''} placeholder="Rasm URL" className="input flex-1"
                  onBlur={e => e.target.value !== cat.image_url && handleUpdate(cat.id, { image_url: e.target.value })} />
                <label className="btn-secondary px-3 flex items-center justify-center cursor-pointer min-w-[40px]" title="Kompuyterdan rasm tanlash">
                  {uploadingId === cat.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingId === cat.id} onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(cat.id, f);
                  }}/>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400">Ko'rinadigan nomi:</label>
              <input defaultValue={cat.custom_name || ''} placeholder="Maxsus nom" className="input"
                onBlur={e => e.target.value !== cat.custom_name && handleUpdate(cat.id, { custom_name: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
