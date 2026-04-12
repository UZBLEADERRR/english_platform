import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Plus, Trash2, ChevronRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

export default function VocabularyPage() {
  const [levels, setLevels] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [view, setView] = useState<'levels' | 'topics' | 'words'>('levels');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  // Forms
  const [topicForm, setTopicForm] = useState({ title: '', icon_url: '' });
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [wordsText, setWordsText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    let data = await adminApi.getLevels('vocabulary').catch(() => []);
    if (!data?.length) {
      data = await adminApi.initLevels('vocabulary').catch(() => []);
    }
    setLevels(data || []);
  };

  const loadTopics = async (levelId: string) => {
    setSelectedLevel(levelId);
    const d = await adminApi.getTopics(levelId).catch(() => []);
    setTopics(d || []);
    setView('topics');
  };

  const loadWords = async (topicId: string) => {
    setSelectedTopic(topicId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/vocabulary/words/${topicId}`, {
        headers: { Authorization: `Bearer ${adminApi.getToken()}` }
      });
      const data = await res.json();
      setWords(data || []);
    } catch { setWords([]); }
    setView('words');
  };

  const addTopic = async () => {
    if (!topicForm.title.trim()) return;
    await adminApi.addTopic({ title: topicForm.title, icon_url: topicForm.icon_url || null, level_id: selectedLevel, sort_order: topics.length });
    setShowTopicForm(false);
    setTopicForm({ title: '', icon_url: '' });
    loadTopics(selectedLevel);
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('Bu mavzuni o\'chirasizmi?')) return;
    await adminApi.deleteTopic(id);
    loadTopics(selectedLevel);
  };

  const generateWords = async () => {
    if (!wordsText.trim() || generating) return;
    setGenerating(true);
    setGeneratingStatus('AI so\'zlarni qayta ishlamoqda...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/vocabulary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminApi.getToken()}` },
        body: JSON.stringify({ topic_id: selectedTopic, words_text: wordsText }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratingStatus(`✅ ${data.count} ta so'z yaratildi!`);
        setWordsText('');
        loadWords(selectedTopic);
      } else {
        setGeneratingStatus(`❌ Xatolik: ${data.error}`);
      }
    } catch (e: any) {
      setGeneratingStatus(`❌ Xatolik: ${e.message}`);
    } finally {
      setGenerating(false);
      setTimeout(() => setGeneratingStatus(''), 5000);
    }
  };

  const deleteWord = async (id: string) => {
    if (!confirm('Bu so\'zni o\'chirasizmi?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/vocabulary/words/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminApi.getToken()}` },
      });
      loadWords(selectedTopic);
    } catch {}
  };

  const goBack = () => {
    if (view === 'words') setView('topics');
    else if (view === 'topics') setView('levels');
  };

  return (
    <div className="space-y-4">
      {view !== 'levels' && (
        <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>
      )}

      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        📚 Vocabulary Boshqaruvi
        <Sparkles className="w-5 h-5 text-yellow-400" />
      </h1>

      {/* Levels View */}
      {view === 'levels' && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">Daraja tanlang, keyin mavzu yarating va so'zlar qo'shing</p>
          {levels.map(level => (
            <button key={level.id} onClick={() => loadTopics(level.id)}
              className="card w-full flex items-center justify-between hover:border-indigo-500/50 transition-colors">
              <span className="text-white font-medium">{level.title}</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {/* Topics View */}
      {view === 'topics' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Mavzular</h2>
            <button onClick={() => setShowTopicForm(!showTopicForm)} className="btn-primary flex items-center gap-1 text-xs">
              <Plus className="w-3 h-3" /> Mavzu qo'shish
            </button>
          </div>
          {showTopicForm && (
            <div className="card space-y-3">
              <input value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="Mavzu nomi (masalan: Mevalar, Hayvonlar)" className="input" />
              <input value={topicForm.icon_url} onChange={e => setTopicForm({ ...topicForm, icon_url: e.target.value })} placeholder="Icon URL (ixtiyoriy)" className="input" />
              <div className="flex gap-2">
                <button onClick={addTopic} className="btn-primary text-xs">Saqlash</button>
                <button onClick={() => setShowTopicForm(false)} className="btn-secondary text-xs">Bekor</button>
              </div>
            </div>
          )}
          {topics.map(topic => (
            <div key={topic.id} className="card flex items-center gap-3">
              <div className="flex-1"><p className="text-white font-medium text-sm">{topic.title}</p></div>
              <button onClick={() => loadWords(topic.id)} className="btn-secondary text-xs">So'zlar <ChevronRight className="w-3 h-3 inline" /></button>
              <button onClick={() => deleteTopic(topic.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {topics.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Hozircha mavzular yo'q</p>}
        </div>
      )}

      {/* Words View */}
      {view === 'words' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">So'zlar qo'shish</h2>
          
          {/* Bulk add form */}
          <div className="card space-y-3">
            <p className="text-slate-400 text-sm">So'zlarni paste qiling. Har bir qatorda: <span className="text-indigo-400">inglizcha - uzbekcha</span></p>
            <textarea 
              value={wordsText} 
              onChange={e => setWordsText(e.target.value)} 
              placeholder={`Masalan:\napple - olma\nbook - kitob\ncar - mashina\ndog - it\ntree - daraxt`}
              className="input min-h-[160px] font-mono text-sm"
              disabled={generating}
            />
            <div className="flex gap-2 items-center">
              <button onClick={generateWords} disabled={generating || !wordsText.trim()} 
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'AI qayta ishlamoqda...' : 'AI orqali yaratish'}
              </button>
            </div>
            {generatingStatus && (
              <p className={`text-sm ${generatingStatus.includes('✅') ? 'text-green-400' : generatingStatus.includes('❌') ? 'text-red-400' : 'text-indigo-400'}`}>
                {generatingStatus}
              </p>
            )}
          </div>

          {/* Words list */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-300">Mavjud so'zlar ({words.length})</h3>
            {words.map(w => (
              <div key={w.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold text-sm">{w.english}</span>
                    <span className="text-slate-400 mx-2">—</span>
                    <span className="text-indigo-400 text-sm">{w.uzbek}</span>
                  </div>
                  <button onClick={() => deleteWord(w.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {w.example && <p className="text-xs text-slate-400 italic">📝 {w.example}</p>}
                {w.synonyms?.length > 0 && (
                  <p className="text-xs text-green-400">✅ Sinonimlari: {w.synonyms.join(', ')}</p>
                )}
                {w.antonyms?.length > 0 && (
                  <p className="text-xs text-orange-400">🔄 Antonimlari: {w.antonyms.join(', ')}</p>
                )}
              </div>
            ))}
            {words.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Hozircha so'zlar yo'q. Yuqoridagi formadan qo'shing</p>}
          </div>
        </div>
      )}
    </div>
  );
}
