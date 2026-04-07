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
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = (sessionId: string) => {
    setCurrentSessionId(sessionId);
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
    navigator.clipboard.writeText(text); setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] -mx-4 sm:mx-0 sm:rounded-3xl relative overflow-hidden bg-surface shadow-2xl">
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
            <button key={s.id} onClick={() => loadMessages(s.id)}
              className={cn("w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-colors text-sm", currentSessionId === s.id ? "bg-primary/10 text-primary" : "text-main hover:bg-surface")}>
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col h-full bg-bg relative overflow-hidden">
        <div className="h-12 shrink-0 border-b border-theme bg-surface flex items-center px-3 gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1.5 text-muted"><Menu className="w-5 h-5" /></button>
          <button onClick={() => navigate(-1)} className="p-1.5 text-muted md:hidden"><ArrowLeft className="w-5 h-5" /></button>
          <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
          <div><h3 className="font-bold text-main text-sm">AI Teacher</h3><p className="text-[10px] text-green-500">Online</p></div>
        </div>

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
              <div className={cn("p-3 rounded-3xl relative group/msg max-w-[85%] shadow-sm", msg.role === 'user' ? "bg-primary text-white rounded-br-sm" : "bg-elevated border border-theme text-main rounded-bl-sm")}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-full overflow-x-auto break-words text-sm">
                    <Markdown components={{
                      pre({ children }: any) {
                        const codeEl = children?.props;
                        const className = codeEl?.className || '';
                        const match = /language-(\w+)/.exec(className);
                        const lang = match ? match[1] : 'text';
                        const code = String(codeEl?.children || '').replace(/\n$/, '');
                        return (
                          <div className="my-2 p-3 bg-elevated rounded-xl border border-theme flex flex-col items-center gap-2 not-prose">
                            <button onClick={() => { setPreviewData({ code, language: lang }); }}
                              className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" /> {t('view')}
                            </button>
                          </div>
                        );
                      }
                    }}>{msg.text}</Markdown>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {msg.image_url && <img src={msg.image_url} alt="" className="max-w-full rounded-lg max-h-48 object-contain" />}
                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                  </div>
                )}
                <button onClick={() => handleCopy(msg.text, msg.id)}
                  className={cn("absolute -bottom-2.5 p-1 rounded-full bg-surface border border-theme text-muted opacity-0 group-hover/msg:opacity-100 shadow-sm z-10", msg.role === 'user' ? "right-3" : "left-3")}>
                  {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
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
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-bg to-transparent shrink-0">
          {selectedImage && (
            <div className="mb-2 relative inline-block">
              <img src={selectedImage.url} alt="" className="h-16 rounded-lg border border-theme" />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </div>
          )}
          {isArtifactMode && (
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg w-fit text-xs font-medium border border-primary/20">
              <Code className="w-3 h-3" /> Artifact mode
              <button onClick={() => setIsArtifactMode(false)} className="ml-1"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="relative flex items-center bg-elevated border border-theme rounded-full focus-within:border-primary/50">
            <div className="relative shrink-0">
              <button onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)} className="p-2.5 ml-0.5 text-muted hover:text-primary rounded-full">
                <Plus className="w-5 h-5" />
              </button>
              {isPlusMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-surface border border-theme rounded-xl shadow-lg py-1.5 min-w-[160px] z-50">
                  <button onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-main hover:bg-elevated flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-500" /> Rasm
                  </button>
                  <button onClick={() => { setIsArtifactMode(true); setIsPlusMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-main hover:bg-elevated flex items-center gap-2">
                    <Code className="w-4 h-4 text-green-500" /> Artifact
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
              className="flex-1 bg-transparent border-none py-2.5 px-2 text-main text-sm placeholder:text-muted focus:outline-none resize-none max-h-[120px] scrollbar-none"
              style={{ minHeight: '40px' }}
            />
            <button onClick={isLoading ? () => {} : handleSend} disabled={(!input.trim() && !selectedImage) && !isLoading}
              className="p-2 mr-1.5 bg-primary text-white rounded-full disabled:opacity-50 shrink-0">
              {isLoading ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
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
