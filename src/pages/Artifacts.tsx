import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import { Trash2, Edit2, X, Code, Play, MoreVertical, FileText, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

const extractHtml = (markdown: string) => {
  const match = markdown.match(/```html\n([\s\S]*?)```/i);
  return match ? match[1] : null;
};

export default function Artifacts() {
  const t = useTranslation();
  const { artifacts, deleteArtifact, updateArtifact } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [viewingArtifact, setViewingArtifact] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startEdit = (e: React.MouseEvent, artifact: any) => {
    e.stopPropagation();
    setEditingId(artifact.id);
    setEditTitle(artifact.title);
    setEditContent(artifact.content);
    setActiveMenuId(null);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId) {
      updateArtifact(editingId, { title: editTitle, content: editContent });
      setEditingId(null);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-elevated rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📦</span>
        </div>
        <h2 className="text-2xl font-bold text-main mb-2">{t('noArtifacts')}</h2>
        <p className="text-muted">Ask the Virtual Teacher to generate artifacts and save them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <h1 className="text-3xl font-bold text-main">{t('artifacts')}</h1>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {artifacts.map((artifact) => {
          const htmlContent = extractHtml(artifact.content);
          
          return (
            <div key={artifact.id} className="flex flex-col gap-2 group relative">
              <div 
                className="bg-surface border border-theme rounded-2xl shadow-sm cursor-pointer hover:border-primary/50 transition-colors relative aspect-square overflow-hidden"
                onClick={() => {
                  if (editingId !== artifact.id) {
                    setViewingArtifact(artifact);
                  }
                }}
              >
                {/* Preview Area */}
                {htmlContent ? (
                  <div className="w-full h-full pointer-events-none bg-white">
                    <iframe 
                      srcDoc={htmlContent} 
                      className="w-full h-full border-none"
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full p-3 overflow-hidden text-[8px] leading-tight text-muted pointer-events-none markdown-body prose prose-sm dark:prose-invert">
                    <Markdown>{artifact.content.substring(0, 300)}</Markdown>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface to-transparent" />
                  </div>
                )}
              </div>

              {/* Title Area */}
              {editingId === artifact.id ? (
                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-elevated border border-theme rounded-lg px-2 py-1 text-sm text-main font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-center">
                    <button onClick={cancelEdit} className="p-1.5 text-muted hover:text-main rounded-lg hover:bg-elevated bg-surface border border-theme">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={saveEdit} className="p-1.5 text-white bg-primary rounded-lg hover:bg-primary-hover">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-1 px-1 relative">
                  <h3 className="font-medium text-sm text-main line-clamp-2 flex-1">
                    {artifact.title}
                  </h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === artifact.id ? null : artifact.id);
                    }}
                    className="p-1 text-muted hover:text-main rounded-full hover:bg-elevated transition-colors shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === artifact.id && (
                    <div ref={menuRef} className="absolute top-6 right-0 bg-surface border border-theme rounded-lg shadow-lg py-1 z-50 w-32">
                      <button 
                        onClick={(e) => startEdit(e, artifact)}
                        className="w-full text-left px-4 py-2 text-sm text-main hover:bg-elevated flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> {t('edit')}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteArtifact(artifact.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> {t('delete')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Screen Viewer Modal */}
      {viewingArtifact && (
        <div className="fixed inset-0 z-[100] bg-bg flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="h-14 border-b border-theme bg-surface flex items-center justify-between px-4">
            <h2 className="font-bold text-main text-lg truncate flex-1">{viewingArtifact.title}</h2>
            
            {extractHtml(viewingArtifact.content) && (
              <div className="flex bg-elevated rounded-lg p-1 mr-4">
                <button 
                  onClick={() => setViewMode('preview')}
                  className={cn("px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors", viewMode === 'preview' ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-main")}
                >
                  <Play className="w-4 h-4" /> Preview
                </button>
                <button 
                  onClick={() => setViewMode('code')}
                  className={cn("px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors", viewMode === 'code' ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-main")}
                >
                  <Code className="w-4 h-4" /> Code
                </button>
              </div>
            )}

            <button 
              onClick={() => setViewingArtifact(null)}
              className="p-2 text-muted hover:text-main rounded-full hover:bg-elevated transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden bg-elevated relative">
            {extractHtml(viewingArtifact.content) && viewMode === 'preview' ? (
              <iframe 
                srcDoc={extractHtml(viewingArtifact.content)!} 
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="w-full h-full overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-surface p-6 rounded-2xl border border-theme shadow-sm markdown-body prose dark:prose-invert max-w-none overflow-x-auto break-words">
                  <Markdown>{viewingArtifact.content}</Markdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
