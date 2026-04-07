import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import api from '../api';
import { ArrowLeft, X } from 'lucide-react';

export default function Tips() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [tips, setTips] = useState<any[]>([]);
  const [viewingTip, setViewingTip] = useState<any>(null);

  useEffect(() => {
    api.getTips().then(setTips).catch(() => {
      setTips(Array.from({ length: 6 }, (_, i) => ({
        id: `t${i}`, title: `English Tip ${i + 1}`,
        cover_image_url: `https://picsum.photos/seed/tip${i}/400/300`,
        html_code: `<html><body style="font-family:sans-serif;padding:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;min-height:100vh;display:flex;align-items:center;justify-content:center;"><div style="text-align:center"><h1>Tip ${i + 1}</h1><p>This is an interactive tip about learning English!</p></div></body></html>`,
      })));
    });
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-elevated"><ArrowLeft className="w-5 h-5 text-main" /></button>
        <h1 className="text-xl font-bold text-main">{t('tips')}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tips.map(tip => (
          <button key={tip.id} onClick={() => setViewingTip(tip)}
            className="relative rounded-2xl overflow-hidden group aspect-[4/3] shadow-md hover:shadow-xl transition-all">
            <img src={tip.cover_image_url} alt={tip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 text-white font-bold text-sm">{tip.title}</span>
          </button>
        ))}
      </div>

      {/* Full screen web app view */}
      {viewingTip && (
        <div className="fixed inset-0 z-[100] bg-bg animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
          <div className="h-12 bg-surface border-b border-theme flex items-center justify-between px-4 shrink-0">
            <h2 className="font-bold text-main text-sm truncate">{viewingTip.title}</h2>
            <button onClick={() => setViewingTip(null)} className="p-2 text-muted hover:text-main"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe srcDoc={viewingTip.html_code} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin allow-forms" />
          </div>
        </div>
      )}
    </div>
  );
}
