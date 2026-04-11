import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../utils';

export default function GrammarChecker() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!text.trim() || !user) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.checkGrammar({ user_id: user.id, text });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setLoading(true); setError(''); setResult(null);
      try {
        const res = await api.checkGrammar({ user_id: user.id, image_base64: base64, image_mime_type: file.type });
        setResult(res);
        if (res.originalText) setText(res.originalText);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 max-w-2xl mx-auto">

      <div className="space-y-3">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder="Ingliz tilidagi matnni yozing..."
          className="w-full p-4 bg-elevated border border-theme rounded-2xl text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />

        <div className="flex gap-3">
          <button onClick={handleCheck} disabled={loading || !text.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {t('check')}
          </button>
          <label className="px-4 py-3 bg-elevated border border-theme rounded-xl cursor-pointer hover:bg-surface transition-colors flex items-center gap-2 text-muted">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">Rasm</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 font-medium">
          {error.includes('limit') ? '⏰ Kunlik limit tugadi. Premium yoki Ultra sotib oling!' : error}
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          {result.correctedText && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-green-500" /><h3 className="font-bold text-green-600 dark:text-green-400">To'g'rilangan matn</h3></div>
              <p className="text-main whitespace-pre-wrap">{result.correctedText}</p>
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-main flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" />{t('errors')} ({result.errors.length})</h3>
              {result.errors.map((err: any, i: number) => (
                <div key={i} className="p-3 bg-surface border border-theme rounded-xl space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 line-through text-sm">{err.original}</span>
                    <span className="text-muted">→</span>
                    <span className="text-green-500 font-medium text-sm">{err.corrected}</span>
                  </div>
                  {err.explanation && <p className="text-xs text-muted">{err.explanation}</p>}
                </div>
              ))}
            </div>
          )}

          {result.errors?.length === 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
              <p className="font-bold text-green-600 dark:text-green-400">Xato topilmadi! 🎉</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
