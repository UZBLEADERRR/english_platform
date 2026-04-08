import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import api from '../api';
import { X, Lock } from 'lucide-react';
import { cn } from '../Layout';
import { useAppStore } from '../store';

export default function Apps() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'required' | 'my'>('required');
  const [myApps, setMyApps] = useState<any[]>([]);
  const [viewingApp, setViewingApp] = useState<any>(null);
  const { user } = useAppStore();

  useEffect(() => {
    api.getApps().then(setApps).catch(() => {});
    if (user) {
      api.get(`/api/chat/artifacts/${user.id}`).then((msgs: any[]) => {

        const artifacts = msgs.map((m, i) => {
          const match = /```html\n([\s\S]*?)```/.exec(m.text) || /```\n([\s\S]*?)```/.exec(m.text);
          const htmlCode = match ? match[1] : '';
          const titleMatch = /<!--\s*title:\s*(.*?)\s*-->/i.exec(htmlCode) || /<!--\s*title:\s*(.*?)\s*-->/i.exec(m.text);
          return {
            id: m.id,
            title: titleMatch ? titleMatch[1] : `Artifact ${i + 1}`,
            app_type: 'code',
            html_code: htmlCode,
            msgContext: m.text
          };
        }).filter(a => a.html_code);
        setMyApps(artifacts);
      }).catch(() => {});
    }
  }, [user]);

  const displayList = activeTab === 'required' ? apps : myApps;

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
        {displayList.map(app => (
          <div key={app.id} className="relative group flex flex-col items-center gap-2">
            <button onClick={() => {
              if (app.is_locked && user?.subscription === 'free') {
                navigate('/pricing');
                return;
              }
              if (app.app_type === 'link' && app.link_url) { window.location.href = app.link_url; }
              else { setViewingApp(app); }
            }} className="flex flex-col items-center gap-2 outline-none w-full relative">
              {app.is_locked && user?.subscription === 'free' && (
                <div className="absolute top-0 right-0 p-1 bg-yellow-500 rounded-full shadow-lg z-10"><Lock className="w-3 h-3 text-white" /></div>
              )}
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all flex shrink-0 items-center justify-center relative">
                {app.app_type === 'code' && app.html_code ? (
                  <div className="w-full h-full pointer-events-none relative scale-[0.2] origin-top-left" style={{ width: '500%', height: '500%' }}>
                    <iframe srcDoc={app.html_code} className="w-[500%] h-[500%] border-none absolute top-0 left-0" sandbox="allow-scripts"/>
                  </div>
                ) : app.icon_url ? (
                  <img src={app.icon_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {app.title?.[0]}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-main text-center line-clamp-2">{app.title}</span>
            </button>
            {activeTab === 'my' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Yangi nom:', app.title);
                  if (newName) {
                    const newText = `<!-- title: ${newName} -->\n` + app.msgContext;
                    api.put(`/api/chat/messages/${app.id}`, { text: newText }).then(() => {
                      setMyApps(p => p.map(a => a.id === app.id ? { ...a, title: newName, msgContext: newText } : a));
                    }).catch(() => {});
                  }
                }}
                className="absolute -top-1 -right-1 p-1.5 bg-surface text-muted hover:text-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <code className="text-[10px]">edit</code>
              </button>
            )}
          </div>
        ))}
      </div>

      {displayList.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">📦</span>
          <p className="text-muted mt-2">{t('noArtifacts')}</p>
        </div>
      )}

      {/* Full screen app view */}
      {viewingApp && (
        <div className="fixed inset-0 z-[100] bg-bg animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
          <div className="h-12 bg-surface border-b border-theme flex items-center px-4 shrink-0 justify-between">
            <button onClick={() => setViewingApp(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-elevated rounded-full hover:bg-white/10 text-main font-medium text-sm transition-colors border border-theme">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Orqaga
            </button>
            <h2 className="font-bold text-main text-sm truncate max-w-[50%]">{viewingApp.title}</h2>
            <div className="w-[80px]"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe srcDoc={viewingApp.html_code} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms" />
          </div>
        </div>
      )}
    </div>
  );
}
