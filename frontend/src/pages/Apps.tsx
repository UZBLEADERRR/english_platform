import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import api from '../api';
import { X } from 'lucide-react';
import { cn } from '../Layout';

export default function Apps() {
  const t = useTranslation();
  const [apps, setApps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'required' | 'my'>('required');
  const [viewingApp, setViewingApp] = useState<any>(null);

  useEffect(() => {
    api.getApps().then(setApps).catch(() => {
      setApps(Array.from({ length: 4 }, (_, i) => ({
        id: `a${i}`, title: `App ${i + 1}`, icon_url: `https://picsum.photos/seed/app${i}/200/200`,
        app_type: 'code', html_code: `<html><body style="font-family:sans-serif;padding:20px;background:#1a1a2e;color:white;min-height:100vh;"><h1>App ${i + 1}</h1><p>Interactive English learning app</p></body></html>`,
      })));
    });
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-main">{t('apps')}</h1>

      {/* Tabs */}
      <div className="flex border-b border-theme">
        <button onClick={() => setActiveTab('required')}
          className={cn("px-4 py-2.5 font-medium text-sm border-b-2 transition-colors", activeTab === 'required' ? "border-primary text-primary" : "border-transparent text-muted")}>
          {t('requiredApps')}
        </button>
        <button onClick={() => setActiveTab('my')}
          className={cn("px-4 py-2.5 font-medium text-sm border-b-2 transition-colors", activeTab === 'my' ? "border-primary text-primary" : "border-transparent text-muted")}>
          {t('myApps')}
        </button>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {apps.map(app => (
          <button key={app.id} onClick={() => {
            if (app.app_type === 'link' && app.link_url) { window.location.href = app.link_url; }
            else { setViewingApp(app); }
          }} className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-elevated shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all">
              {app.icon_url ? (
                <img src={app.icon_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {app.title?.[0]}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-main text-center line-clamp-2">{app.title}</span>
          </button>
        ))}
      </div>

      {apps.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">📦</span>
          <p className="text-muted mt-2">{t('noArtifacts')}</p>
        </div>
      )}

      {/* Full screen app view */}
      {viewingApp && (
        <div className="fixed inset-0 z-[100] bg-bg animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
          <div className="h-12 bg-surface border-b border-theme flex items-center justify-between px-4 shrink-0">
            <h2 className="font-bold text-main text-sm truncate flex-1">{viewingApp.title}</h2>
            <button onClick={() => setViewingApp(null)} className="p-2 text-muted hover:text-main"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe srcDoc={viewingApp.html_code} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms" />
          </div>
        </div>
      )}
    </div>
  );
}
