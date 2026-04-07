import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2 } from 'lucide-react';

export default function ReelsPage() {
  const [data, setData] = useState<any[]>([]);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [wordForm, setWordForm] = useState({ category_id: '', words_string: '' });
  const [showWordForm, setShowWordForm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
              <button onClick={() => setShowWordForm(showWordForm === cat.id ? '' : cat.id)} className="btn-secondary text-xs"><Plus className="w-3 h-3 inline" /> So'z</button>
              <button onClick={() => { if(confirm('O\'chirish?')) adminApi.deleteReelCategory(cat.id).then(load); }} className="btn-danger text-xs"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          {showWordForm === cat.id && (
            <div className="flex gap-2 flex-col">
              <textarea value={wordForm.words_string} onChange={e => setWordForm({...wordForm, words_string: e.target.value})} placeholder="So'zlarni vergul bilan kiriting: masalan: apple, logic, sun" className="input flex-1 min-h-[80px]" disabled={isGenerating} />
              <button onClick={() => generateWords(cat.id)} className="btn-primary text-xs w-full disabled:opacity-50" disabled={isGenerating}>
                {isGenerating ? 'AI Avtomatik Yaratmoqda, Kuting...' : 'AI Orqali Generate Qilish'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {cat.reel_words?.map((w: any) => {
              const wordDisplay = w.word.split('||')[0];
              return (
                <div key={w.id} className="relative group">
                  <img src={w.image_url} alt={wordDisplay} className="w-full aspect-[9/16] rounded-lg object-cover" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
                  <p className="text-xs text-slate-300 text-center mt-1 truncate">{wordDisplay}</p>
                  <button onClick={() => adminApi.deleteReelWord(w.id).then(load)} className="absolute top-1 right-1 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
