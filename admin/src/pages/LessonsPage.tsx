import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, Lock, Unlock, ChevronRight, ArrowLeft, GripVertical, Save } from 'lucide-react';

type View = 'categories' | 'levels' | 'topics' | 'elements';

export default function LessonsPage() {
  const [view, setView] = useState<View>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Forms
  const [topicForm, setTopicForm] = useState({ title: '', icon_url: '', is_locked: false, is_premium: false });
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [elementForm, setElementForm] = useState<any>({ element_type: 'text', content: { text: '' } });
  const [showElementForm, setShowElementForm] = useState(false);

  useEffect(() => { adminApi.getCategories().then(c => setCategories(c.filter((x: any) => ['grammar','vocabulary','reading','writing','listening','speaking'].includes(x.id)))).catch(() => {}); }, []);

  const loadLevels = async (catId: string) => {
    setSelectedCat(catId);
    let data = await adminApi.getLevels(catId).catch(() => []);
    if (!data?.length) { data = await adminApi.initLevels(catId).catch(() => []); }
    setLevels(data || []); setView('levels');
  };

  const loadTopics = async (levelId: string) => { setSelectedLevel(levelId); const d = await adminApi.getTopics(levelId).catch(() => []); setTopics(d || []); setView('topics'); };
  const loadElements = async (topicId: string) => { setSelectedTopic(topicId); const d = await adminApi.getLessonElements(topicId).catch(() => []); setElements(d || []); setView('elements'); };

  const addTopic = async () => { await adminApi.addTopic({ ...topicForm, level_id: selectedLevel, sort_order: topics.length }); setShowTopicForm(false); setTopicForm({ title: '', icon_url: '', is_locked: false, is_premium: false }); loadTopics(selectedLevel); };
  const deleteTopic = async (id: string) => { if(!confirm('O\'chirish?')) return; await adminApi.deleteTopic(id); loadTopics(selectedLevel); };
  const toggleTopicLock = async (t: any) => { await adminApi.updateTopic(t.id, { is_locked: !t.is_locked }); loadTopics(selectedLevel); };

  const addElement = async () => { await adminApi.addElement({ ...elementForm, topic_id: selectedTopic, sort_order: elements.length }); setShowElementForm(false); setElementForm({ element_type: 'text', content: { text: '' } }); loadElements(selectedTopic); };
  const deleteElement = async (id: string) => { if(!confirm('O\'chirish?')) return; await adminApi.deleteElement(id); loadElements(selectedTopic); };

  const goBack = () => {
    if (view === 'elements') setView('topics');
    else if (view === 'topics') setView('levels');
    else if (view === 'levels') setView('categories');
  };

  const elementTypes = ['text','image','video','audio','strategy','example','exception','mistake','webview','quiz','link','divider'];

  return (
    <div className="space-y-4">
      {view !== 'categories' && (
        <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Orqaga</button>
      )}

      {view === 'categories' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Bo'limni tanlang</h2>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => loadLevels(cat.id)} className="card w-full flex items-center justify-between hover:border-indigo-500/50 transition-colors">
              <span className="text-white font-medium">{cat.custom_name || cat.id}</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {view === 'levels' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Darajalar — {selectedCat}</h2>
          {levels.map(level => (
            <div key={level.id} className="card flex items-center gap-3">
              <div className="flex-1">
                <input defaultValue={level.title} className="input" onBlur={e => adminApi.updateLevel(level.id, { title: e.target.value })} />
              </div>
              <button onClick={() => adminApi.updateLevel(level.id, { is_locked: !level.is_locked }).then(() => loadLevels(selectedCat))}
                className={`p-2 rounded-lg ${level.is_locked ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'}`}>
                {level.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <button onClick={() => loadTopics(level.id)} className="btn-secondary text-xs">Mavzular <ChevronRight className="w-3 h-3 inline" /></button>
            </div>
          ))}
        </div>
      )}

      {view === 'topics' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Mavzular</h2>
            <button onClick={() => setShowTopicForm(!showTopicForm)} className="btn-primary flex items-center gap-1 text-xs"><Plus className="w-3 h-3" /> Qo'shish</button>
          </div>
          {showTopicForm && (
            <div className="card space-y-3">
              <input value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} placeholder="Mavzu nomi" className="input" />
              <input value={topicForm.icon_url} onChange={e => setTopicForm({...topicForm, icon_url: e.target.value})} placeholder="Icon URL" className="input" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={topicForm.is_locked} onChange={e => setTopicForm({...topicForm, is_locked: e.target.checked})} /> Qulflangan</label>
                <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={topicForm.is_premium} onChange={e => setTopicForm({...topicForm, is_premium: e.target.checked})} /> Premium</label>
              </div>
              <div className="flex gap-2"><button onClick={addTopic} className="btn-primary text-xs">Saqlash</button><button onClick={() => setShowTopicForm(false)} className="btn-secondary text-xs">Bekor</button></div>
            </div>
          )}
          {topics.map(topic => (
            <div key={topic.id} className="card flex items-start gap-3">
              {topic.icon_url && <img src={topic.icon_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-surface" />}
              <div className="flex-1 flex flex-col gap-2">
                <input 
                  defaultValue={topic.title} 
                  className="input px-3 py-1.5 text-sm h-auto" 
                  onBlur={e => {
                    if (e.target.value && e.target.value !== topic.title) {
                      adminApi.updateTopic(topic.id, { title: e.target.value }).then(() => loadTopics(selectedLevel));
                    }
                  }} 
                />
                <input 
                  defaultValue={topic.icon_url || ''} 
                  placeholder="Icon URL (ixtiyoriy)" 
                  className="input px-3 py-1.5 text-xs h-auto font-mono bg-transparent border-theme focus:bg-elevated" 
                  onBlur={e => {
                    if (e.target.value !== (topic.icon_url || '')) {
                      adminApi.updateTopic(topic.id, { icon_url: e.target.value || null }).then(() => loadTopics(selectedLevel));
                    }
                  }} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleTopicLock(topic)} className={`p-1.5 rounded-lg text-xs ${topic.is_locked ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>
                    {topic.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteTopic(topic.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <button onClick={() => loadElements(topic.id)} className="btn-secondary w-full text-xs">Darslar <ChevronRight className="w-3 h-3 inline" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'elements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Dars elementlari</h2>
            <button onClick={() => setShowElementForm(!showElementForm)} className="btn-primary flex items-center gap-1 text-xs"><Plus className="w-3 h-3" /> Element</button>
          </div>
          {showElementForm && (
            <div className="card space-y-3">
              <select value={elementForm.element_type} onChange={e => setElementForm({ element_type: e.target.value, content: {} })} className="input">
                {elementTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {elementForm.element_type === 'text' && <textarea value={elementForm.content.text || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, text: e.target.value }})} placeholder="Matn" className="input min-h-[80px]" />}
              {elementForm.element_type === 'image' && <input value={elementForm.content.url || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, url: e.target.value }})} placeholder="Rasm URL" className="input" />}
              {elementForm.element_type === 'video' && <input value={elementForm.content.url || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, url: e.target.value }})} placeholder="Video URL" className="input" />}
              {elementForm.element_type === 'audio' && <input value={elementForm.content.url || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, url: e.target.value }})} placeholder="Audio URL" className="input" />}
              {['strategy','example','exception','mistake'].includes(elementForm.element_type) && (
                <>
                  <input value={elementForm.content.title || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, title: e.target.value }})} placeholder="Sarlavha" className="input" />
                  <textarea value={elementForm.content.text || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, text: e.target.value }})} placeholder="Matn" className="input min-h-[60px]" />
                </>
              )}
              {elementForm.element_type === 'webview' && <textarea value={elementForm.content.html_code || ''} onChange={e => setElementForm({...elementForm, content: { html_code: e.target.value }})} placeholder="HTML kod" className="input min-h-[100px] font-mono text-xs" />}
              {elementForm.element_type === 'quiz' && (
                <>
                  <input value={elementForm.content.question || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, question: e.target.value }})} placeholder="Savol" className="input" />
                  <input value={(elementForm.content.options || []).join(',')} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, options: e.target.value.split(',') }})} placeholder="Variantlar (vergul bilan)" className="input" />
                  <input type="number" value={elementForm.content.correct_index ?? 0} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, correct_index: parseInt(e.target.value) }})} placeholder="To'g'ri javob indeksi" className="input" />
                  <input value={elementForm.content.explanation || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, explanation: e.target.value }})} placeholder="Tushuntirish" className="input" />
                </>
              )}
              {elementForm.element_type === 'link' && (
                <>
                  <input value={elementForm.content.url || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, url: e.target.value }})} placeholder="URL" className="input" />
                  <input value={elementForm.content.label || ''} onChange={e => setElementForm({...elementForm, content: { ...elementForm.content, label: e.target.value }})} placeholder="Label" className="input" />
                </>
              )}
              <div className="flex gap-2"><button onClick={addElement} className="btn-primary text-xs">Saqlash</button><button onClick={() => setShowElementForm(false)} className="btn-secondary text-xs">Bekor</button></div>
            </div>
          )}
          {elements.map((el, i) => (
            <div key={el.id} className="card flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-xs font-mono">{el.element_type}</span>
              <p className="flex-1 text-slate-300 text-sm truncate">{JSON.stringify(el.content).substring(0, 60)}...</p>
              <button onClick={() => deleteElement(el.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
