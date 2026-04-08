import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { Menu, Plus, Send, Square, X, MessageSquare, Trash2, Edit2, Bot, Code, Play, Maximize2, ImageIcon, Copy, Check, ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiChat() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAppStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  const [isArtifactMode, setIsArtifactMode] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ code: string; language: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    api.getChatSessions(user.id).then(s => {
      setSessions(s);
      if (s.length > 0) {
        setCurrentSessionId(s[0].id);
        api.getChatMessages(s[0].id).then(setMessages);
      } else {
        createNewChat();
      }
    }).catch(() => {});
  }, [user]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad ? 'auto' : 'smooth' });
    if (messages.length > 0 && isInitialLoad) {
      setTimeout(() => setIsInitialLoad(false), 100);
    }
  }, [messages]);

  const loadMessages = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsInitialLoad(true);
    api.getChatMessages(sessionId).then(setMessages).catch(() => {});
    setIsSidebarOpen(false);
  };

  const createNewChat = async () => {
    if (!user) return;
    try {
      const session = await api.createChatSession(user.id);
      setSessions(p => [session, ...p]);
      setCurrentSessionId(session.id);
      const msgs = await api.getChatMessages(session.id);
      setMessages(msgs);
      setIsSidebarOpen(false);
    } catch {}
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || !currentSessionId || !user) return;

    const userMsg = { id: `temp-${Date.now()}`, role: 'user', text: input, image_url: selectedImage?.url };
    setMessages(p => [...p, userMsg]);
    const currentInput = input;
    const currentImage = selectedImage;
    setInput(''); setSelectedImage(null); setIsLoading(true);

    try {
      const res = await api.sendMessage({
        session_id: currentSessionId, user_id: user.id, text: currentInput,
        image_base64: currentImage?.base64, image_mime_type: currentImage?.mimeType,
        is_artifact_mode: isArtifactMode,
      });
      setMessages(p => {
        const filtered = p.filter(m => m.id !== userMsg.id);
        return [...filtered, res.userMessage, res.modelMessage];
      });
      if (res.creditsUsed !== undefined) updateUser({ ai_credits_used: res.creditsUsed });
      setIsArtifactMode(false);
    } catch (e: any) {
      if (e.message?.includes('limit')) {
        setMessages(p => [...p, { id: `err-${Date.now()}`, role: 'model', text: `⏰ Kunlik xabar limiti tugadi! Premium: 20 ta, Ultra: cheksiz. /pricing sahifasidan sotib oling.` }]);
      } else {
        setMessages(p => [...p, { id: `err-${Date.now()}`, role: 'model', text: 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.' }]);
      }
    } finally { setIsLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setSelectedImage({ url: URL.createObjectURL(file), base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    } catch(e) {}
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-surface">
      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={cn("absolute md:relative z-30 h-full w-72 bg-elevated border-r border-theme transition-transform duration-300 flex flex-col", isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <h2 className="font-bold text-main text-sm">{t('chatHistory')}</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-3">
          <button onClick={createNewChat} className="w-full flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium text-sm">
            <Plus className="w-4 h-4" /> {t('newChat')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.map(s => (
            <div key={s.id} className={cn("w-full flex items-center justify-between gap-2 p-2.5 rounded-lg transition-colors text-sm group", currentSessionId === s.id ? "bg-primary/10 text-primary" : "hover:bg-surface")}>
              <button onClick={() => loadMessages(s.id)} className="flex-1 flex items-center gap-2 text-left truncate text-main">
                <MessageSquare className="w-4 h-4 shrink-0 text-muted" />
                <span className="truncate">{s.title}</span>
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => {
                  const title = prompt('Yangi nom:', s.title);
                  if (title) {
                    api.updateChatSession(s.id, { title }).then(() => setSessions(p => p.map(x => x.id === s.id ? { ...x, title } : x)));
                  }
                }} className="p-1.5 text-muted hover:text-blue-500 rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => {
                  if (confirm("O'chirishni xohlaysizmi?")) {
                    api.deleteChatSession(s.id).then(() => {
                      setSessions(p => p.filter(x => x.id !== s.id));
                      if (currentSessionId === s.id) {
                        setMessages([]); setCurrentSessionId(null);
                      }
                    });
                  }
                }} className="p-1.5 text-muted hover:text-red-500 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col h-full bg-bg relative overflow-hidden">
        {/* Floating Sidebar Button */}
        <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-40 md:hidden p-2 bg-surface/80 backdrop-blur-md border border-theme rounded-xl shadow-sm text-main hover:bg-elevated transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 pb-20">
          <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("flex w-full group", msg.role === 'user' ? "justify-end" : "justify-start")}
            >
              <div className={cn("p-1 relative max-w-full lg:max-w-4xl mx-auto w-full flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-full w-full overflow-x-auto break-words text-[15px] leading-relaxed px-2 md:px-8">
                    <Markdown components={{
                      pre({ children }: any) {
                        const codeEl = children?.props;
                        const className = codeEl?.className || '';
                        const match = /language-(\w+)/.exec(className);
                        const lang = match ? match[1] : 'text';
                        const code = String(codeEl?.children || '').replace(/\n$/, '');
                        if (lang === 'html') {
                          return (
                            <div className="my-4 p-4 bg-surface rounded-2xl border border-theme shadow-sm relative w-full overflow-hidden flex flex-col items-center gap-3">
                              <div className="w-full text-center text-xs font-semibold text-muted bg-elevated py-1.5 rounded-lg">Artifact</div>
                              <div className="relative w-full aspect-video scale-[0.4] origin-top max-h-[160px]" style={{ height: '500px' }}>
                                <iframe srcDoc={code} className="w-[250%] h-[250%] border-none absolute top-0 left-0" sandbox="allow-scripts" />
                              </div>
                              <button onClick={() => { setPreviewData({ code, language: lang }); }}
                                className="px-5 py-2 bg-primary text-white rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all absolute bottom-4">
                                <Maximize2 className="w-4 h-4" /> Kichik darchada ochish
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="my-2 p-3 bg-elevated rounded-xl border border-theme overflow-x-auto">
                            <pre><code>{code}</code></pre>
                            <button onClick={() => { setPreviewData({ code, language: lang }); }} className="mt-2 text-xs text-primary flex items-center gap-1 font-semibold"><Maximize2 className="w-3 h-3"/> To'liq ko'rish</button>
                          </div>
                        );
                      }
                    }}>{msg.text}</Markdown>
                    <div className="flex justify-start mt-2 border-t border-theme pt-2 opacity-60 hover:opacity-100 transition-opacity">
                      <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 rounded-full hover:bg-elevated text-muted flex items-center gap-1.5 text-xs font-semibold">
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} Nusxa olish
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-zinc-800/80 text-white p-4 rounded-3xl rounded-br-sm shadow-sm max-w-[85%] self-end">
                    {msg.image_url && <img src={msg.image_url} alt="" className="max-w-full rounded-2xl max-h-56 object-contain" />}
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start"><div className="p-3 rounded-2xl bg-surface border border-theme flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div></div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-bg via-bg/90 to-transparent shrink-0">
          <div className="max-w-2xl mx-auto">
            {selectedImage && (
              <div className="mb-2 relative inline-block">
                <img src={selectedImage.url} alt="" className="h-16 rounded-xl border border-theme shadow-sm" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"><X className="w-3 h-3" /></button>
              </div>
            )}
            {isArtifactMode && (
              <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-theme text-main rounded-xl w-fit text-xs font-semibold shadow-sm">
                <Code className="w-3.5 h-3.5" /> App mode
                <button onClick={() => setIsArtifactMode(false)} className="ml-1 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
              </div>
            )}
            <div className="relative flex items-center bg-surface border border-theme shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[32px] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 mt-2">
              <div className="relative shrink-0">
                <button onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)} className="p-2 ml-1 text-muted hover:text-primary rounded-full transition-colors bg-elevated border border-white/5">
                  <Plus className="w-5 h-5" />
                </button>
                {isPlusMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-3 bg-surface border border-theme rounded-2xl shadow-xl py-2 min-w-[160px] z-50 overflow-hidden text-sm">
                    <button onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-main hover:bg-elevated flex items-center gap-3 transition-colors">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg"><ImageIcon className="w-4 h-4 text-blue-500" /></div> Rasm
                    </button>
                    <button onClick={() => { setIsArtifactMode(true); setIsPlusMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-main hover:bg-elevated flex items-center gap-3 transition-colors">
                      <div className="p-1.5 bg-green-500/10 rounded-lg"><Code className="w-4 h-4 text-green-500" /></div> Artifact
                    </button>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <textarea
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={t('typeMessage')}
                className="flex-1 bg-transparent border-none py-3 px-3 text-main text-[15px] placeholder:text-muted focus:outline-none resize-none max-h-[120px] scrollbar-none font-medium"
              />
              <button onClick={isLoading ? () => {} : handleSend} disabled={(!input.trim() && !selectedImage) && !isLoading}
                className="p-2.5 mr-1 bg-primary text-white rounded-full shadow-lg hover:shadow-primary/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all shrink-0">
                {isLoading ? <Square className="w-5 h-5 fill-current" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-[100] bg-bg flex flex-col animate-in slide-in-from-bottom-4">
          <div className="h-12 border-b border-theme bg-surface flex items-center justify-between px-4">
            <h2 className="font-bold text-main text-sm">{previewData.language === 'html' ? 'Interactive' : 'Code'}</h2>
            <button onClick={() => setPreviewData(null)} className="p-2 text-muted hover:text-main"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-hidden">
            {previewData.language === 'html' ? (
              <iframe srcDoc={previewData.code} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms" />
            ) : (
              <div className="w-full h-full overflow-y-auto p-4"><pre className="bg-surface p-4 rounded-xl border border-theme overflow-x-auto"><code>{previewData.code}</code></pre></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
