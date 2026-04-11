import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export default function ReelsPage() {
  const [data, setData] = useState<any[]>([]);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [wordForm, setWordForm] = useState({ category_id: '', words_string: '' });
  const [showWordForm, setShowWordForm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [uploadingReel, setUploadingReel] = useState(false);
  
  const load = () => adminApi.getReels().then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const addCategory = async () => { if(!catName) return; await adminApi.addReelCategory({ name: catName }); setCatName(''); setShowCatForm(false); load(); };
  
  const generateWords = async (catId: string) => { 
    if(!wordForm.words_string) return;
    setIsGenerating(true);
    try { 
      await adminApi.generateReelWords({ category_id: catId, words_string: wordForm.words_string }); 
      setWordForm({ category_id: '', words_string: '' }); 
      setShowWordForm(''); 
      load(); 
    } catch(e:any) { alert(e.message); }
    setIsGenerating(false);
  };

  const handleReelUpload = async (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReel(true);
    try {
      const res = await adminApi.uploadFile(file);
      await adminApi.addReelWord({ category_id: catId, word: file.name.split('.')[0] + '||||', image_url: res.url });
      load();
    } catch(err: any) { alert(err.message); }
    finally { setUploadingReel(false); }
  };

  const startEditWord = (word: any) => {
    setEditingWord(word.id);
    setEditImageUrl(word.image_url || '');
  };

  const saveEditWord = async (wordId: string) => {
    try {
      await adminApi.updateReelWord(wordId, { image_url: editImageUrl });
      setEditingWord(null);
      load();
    } catch(e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Reels (So'zlar)</h1>
        <button onClick={() => setShowCatForm(!showCatForm)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Bo'lim</button>
      </div>
      {showCatForm && (
        <div className="card flex gap-2">
          <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Bo'lim nomi" className="input flex-1" />
          <button onClick={addCategory} className="btn-primary text-xs">Saqlash</button>
        </div>
      )}
      {data.map(cat => (
        <div key={cat.id} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">{cat.name}</h3>
            <div className="flex gap-2">
              <label className="btn-primary text-xs cursor-pointer flex items-center justify-center">
                {uploadingReel ? '⏳ Kuting...' : 'Video/Media Yuklash'}
                <input type="file" accept="video/*,image/*" className="hidden" onChange={(e) => handleReelUpload(cat.id, e)} disabled={uploadingReel} />
              </label>
              <button onClick={() => setShowWordForm(showWordForm === cat.id ? '' : cat.id)} className="btn-secondary text-xs"><Plus className="w-3 h-3 inline" /> So'z</button>
              <button onClick={() => { if(confirm("O'chirish?")) adminApi.deleteReelCategory(cat.id).then(load); }} className="btn-danger text-xs"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          {showWordForm === cat.id && (
            <div className="flex gap-2 flex-col">
              <textarea value={wordForm.words_string} onChange={e => setWordForm({...wordForm, words_string: e.target.value})} placeholder={"So'zlarni har qatorga bittadan yozing:\napple\ncar\nsun\n\nyoki vergul bilan: apple, car, sun"} className="input flex-1 min-h-[120px]" disabled={isGenerating} />
              <p className="text-xs text-slate-400">💡 Har qatorga bitta so'z yoki vergul bilan ajrating. 50+ so'z birdaniga qo'shish mumkin.</p>
              <button onClick={() => generateWords(cat.id)} className="btn-primary text-xs w-full disabled:opacity-50" disabled={isGenerating}>
                {isGenerating ? '⏳ AI Yaratmoqda, Kuting...' : '🤖 AI Orqali Generate Qilish'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {cat.reel_words?.map((w: any) => {
              const wordDisplay = w.word.split('||')[0];
              const isEditing = editingWord === w.id;
              return (
                <div key={w.id} className="relative group">
                  <img src={w.image_url} alt={wordDisplay} className="w-full aspect-[9/16] rounded-lg object-cover" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
                  <p className="text-xs text-slate-300 text-center mt-1 truncate">{wordDisplay}</p>
                  
                  {/* Hover actions */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditWord(w)} className="p-1.5 bg-blue-500 rounded-full"><Edit2 className="w-3 h-3 text-white" /></button>
                    <button onClick={() => adminApi.deleteReelWord(w.id).then(load)} className="p-1.5 bg-red-500 rounded-full"><Trash2 className="w-3 h-3 text-white" /></button>
                  </div>

                  {/* Edit modal */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/80 rounded-lg flex flex-col items-center justify-center p-2 gap-2">
                      <input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} placeholder="Yangi rasm URL" className="input text-xs w-full" />
                      <div className="flex gap-1">
                        <button onClick={() => saveEditWord(w.id)} className="p-1.5 bg-green-500 rounded-full"><Check className="w-3 h-3 text-white" /></button>
                        <button onClick={() => setEditingWord(null)} className="p-1.5 bg-red-500 rounded-full"><X className="w-3 h-3 text-white" /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
