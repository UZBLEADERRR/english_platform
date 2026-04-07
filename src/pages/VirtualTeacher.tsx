import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore, ChatMessage } from '../store';
import { Menu, Plus, Send, X, MessageSquare, Trash2, Edit2, Bot, Save, Check, Code, Play, Maximize2, ImageIcon, Copy } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function VirtualTeacher() {
  const t = useTranslation();
  const { chats, currentChatId, createChat, setCurrentChat, deleteChat, updateChatTitle, addMessageToChat, addArtifact } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [previewData, setPreviewData] = useState<{code: string, language: string} | null>(null);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  const [selectedImage, setSelectedImage] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
  const [isArtifactMode, setIsArtifactMode] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure there's always a chat
  useEffect(() => {
    if (chats.length === 0) {
      createChat();
    } else if (!currentChatId) {
      setCurrentChat(chats[0].id);
    }
  }, [chats, currentChatId, createChat, setCurrentChat]);

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const base64Data = base64String.split(',')[1];
      setSelectedImage({
        url: URL.createObjectURL(file),
        base64: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || !currentChatId) return;

    const userMessage: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input,
      imageUrl: selectedImage?.url 
    };
    addMessageToChat(currentChatId, userMessage);
    
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const systemInstruction = isArtifactMode 
        ? "Sen Teacher Tuxum (Ustoz Tuxum) san. Qattiqqo'l, hazilkash, o'quvchilarni sensirab, biroz qo'polroq murojaat qiladigan ingliz tili ustozisan. Tushuntirishlaring aniq, lekin gaplaringda doim kesatiq, hazil va qattiqqo'llik sezilib tursin. O'quvchi xato qilsa, ustidan biroz kulib, keyin to'g'risini o'rgat. Emojilardan doim foydalan. Foydalanuvchi artifact (interaktiv narsa) so'radi, shuning uchun FAQAT bitta ```html blokida HTML, CSS (Tailwind) va JS yoz. Yaratilgan artifactlar MOBILE uchun to'liq moslashgan (responsive) bo'lishi SHART."
        : "Sen Teacher Tuxum (Ustoz Tuxum) san. Qattiqqo'l, hazilkash, o'quvchilarni sensirab, biroz qo'polroq murojaat qiladigan ingliz tili ustozisan. Tushuntirishlaring aniq, lekin gaplaringda doim kesatiq, hazil va qattiqqo'llik sezilib tursin. O'quvchi xato qilsa, ustidan biroz kulib, keyin to'g'risini o'rgat. Emojilardan doim foydalan. Agar foydalanuvchi qoida so'rasa, markdown orqali chiroyli tushuntir. Interaktiv HTML/CSS/JS artifactlarni umuman yaratma (faqat matn, ro'yxat va misollar ber).";

      // Build chat history context
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const currentParts: any[] = [{ text: currentInput || "What's in this image?" }];
      if (currentImage) {
        currentParts.push({
          inlineData: {
            data: currentImage.base64,
            mimeType: currentImage.mimeType
          }
        });
      }

      const contents = [...history, { role: 'user', parts: currentParts }];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const responseText = response.text || 'Sorry, I could not generate a response.';
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
      };
      addMessageToChat(currentChatId, modelMessage);
      
      // Auto-save artifact if it contains code AND artifact mode is ON
      if (isArtifactMode && responseText.includes('```')) {
        addArtifact({
          title: `Artifact from Chat`,
          content: responseText
        });
      }
      
      // Reset artifact mode after generating
      setIsArtifactMode(false);
      
      // Auto-update title if it's the first user message
      if (messages.length === 1) {
        const newTitle = currentInput.length > 30 ? currentInput.substring(0, 30) + '...' : (currentInput || 'Image Chat');
        updateChatTitle(currentChatId, newTitle);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      addMessageToChat(currentChatId, { id: Date.now().toString(), role: 'model', text: 'An error occurred while connecting to the AI.' });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditTitle = (e: React.MouseEvent, chat: any) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (editingChatId && editTitle.trim()) {
      updateChatTitle(editingChatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-surface">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "absolute md:relative z-30 h-full w-72 bg-elevated border-r border-theme transition-transform duration-300 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <h2 className="font-bold text-main">{t('chatHistory')}</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-muted hover:text-main">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => {
              createChat();
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('newChat')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => {
                setCurrentChat(chat.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg cursor-pointer group transition-colors",
                currentChatId === chat.id ? "bg-primary/10 text-primary" : "hover:bg-surface text-main"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <MessageSquare className={cn("w-4 h-4 flex-shrink-0", currentChatId === chat.id ? "text-primary" : "text-muted")} />
                
                {editingChatId === chat.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && saveTitle(e)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-surface border border-theme rounded px-2 py-1 text-sm text-main focus:outline-none"
                  />
                ) : (
                  <span className="text-sm truncate">{chat.title}</span>
                )}
              </div>
              
              {editingChatId !== chat.id && (
                <div className="hidden group-hover:flex items-center gap-1 ml-2">
                  <button onClick={(e) => startEditTitle(e, chat)} className="p-1 text-muted hover:text-primary"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="p-1 text-muted hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-bg relative overflow-hidden">
        {/* Chat Header */}
        <div className="h-14 shrink-0 border-b border-theme bg-surface flex items-center px-4 gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 text-muted hover:text-main rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-main text-sm">Teacher Tuxum</h3>
            <p className="text-xs text-green-500 font-medium">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex w-full group",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl relative group/msg",
                msg.role === 'user' 
                  ? "bg-elevated text-main border border-theme rounded-br-sm max-w-[85%] md:max-w-[75%]" 
                  : "bg-surface border border-theme text-main w-full md:w-[85%]"
              )}>
                {msg.role === 'model' ? (
                  <>
                    <div className="markdown-body prose prose-sm dark:prose-invert max-w-full overflow-x-auto break-words">
                      <Markdown
                        components={{
                          pre({ children }: any) {
                            const codeElement = children?.props;
                            const className = codeElement?.className || '';
                            const match = /language-(\w+)/.exec(className);
                            const language = match ? match[1] : 'text';
                            const codeString = String(codeElement?.children || '').replace(/\n$/, '');
                            const isHtml = language === 'html';

                            return (
                              <div className="my-4 p-4 bg-elevated rounded-xl border border-theme flex flex-col items-center justify-center gap-3 shadow-sm not-prose">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                  {isHtml ? <Play className="w-6 h-6 ml-1" /> : <Code className="w-6 h-6" />}
                                </div>
                                <p className="font-medium text-main text-center">
                                  {isHtml ? (t('interactiveArtifact') || 'Interactive Artifact') : (t('codeSnippet') || 'Code Snippet')}
                                </p>
                                <button
                                  onClick={() => {
                                    setPreviewData({ code: codeString, language });
                                    setPreviewMode(isHtml ? 'preview' : 'code');
                                  }}
                                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors font-medium flex items-center gap-2"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                  {t('view') || "Ko'rish"}
                                </button>
                              </div>
                            );
                          }
                        }}
                      >
                        {msg.text}
                      </Markdown>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-lg max-h-60 object-contain" />
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
                
                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(msg.text, msg.id)}
                  className={cn(
                    "absolute -bottom-3 p-1.5 rounded-full bg-surface border border-theme text-muted hover:text-main hover:bg-elevated transition-colors opacity-0 group-hover/msg:opacity-100 shadow-sm z-10",
                    msg.role === 'user' ? "right-4" : "left-4"
                  )}
                  title="Copy message"
                >
                  {copiedId === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mr-auto max-w-[85%] md:max-w-[75%] flex">
              <div className="p-4 rounded-2xl bg-surface border border-theme rounded-bl-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface border-t border-theme shrink-0">
          {selectedImage && (
            <div className="max-w-4xl mx-auto mb-2 relative inline-block">
              <img src={selectedImage.url} alt="Preview" className="h-20 rounded-lg border border-theme" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {isArtifactMode && (
            <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg w-fit text-xs font-medium border border-primary/20">
              <Code className="w-3 h-3" />
              Artifact mode active
              <button onClick={() => setIsArtifactMode(false)} className="ml-1 hover:text-primary-hover">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="relative flex items-center max-w-4xl mx-auto bg-elevated border border-theme rounded-full shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="relative shrink-0" ref={plusMenuRef}>
              <button 
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className="p-3 ml-1 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface z-10"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              {isPlusMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-surface border border-theme rounded-xl shadow-lg py-2 min-w-[180px] z-50 animate-in slide-in-from-bottom-2">
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-main hover:bg-elevated flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-500" /> Rasm yuklash
                  </button>
                  <button 
                    onClick={() => {
                      setIsArtifactMode(true);
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-main hover:bg-elevated flex items-center gap-2"
                  >
                    <Code className="w-4 h-4 text-green-500" /> Artifact yaratish
                  </button>
                </div>
              )}
            </div>

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('typeMessage')}
              className="flex-1 bg-transparent border-none py-3 px-2 text-main placeholder:text-muted focus:outline-none focus:ring-0"
            />
            <button 
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="p-2 mr-2 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Viewer Modal */}
      {previewData && (
        <div className="fixed inset-0 z-[100] bg-bg flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="h-14 border-b border-theme bg-surface flex items-center justify-between px-4">
            <h2 className="font-bold text-main text-lg truncate flex-1">
              {previewData.language === 'html' ? (t('interactiveArtifact') || 'Interactive Artifact') : (t('codeSnippet') || 'Code Snippet')}
            </h2>
            
            {previewData.language === 'html' && (
              <div className="flex bg-elevated rounded-lg p-1 mr-4">
                <button 
                  onClick={() => setPreviewMode('preview')}
                  className={cn("px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors", previewMode === 'preview' ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-main")}
                >
                  <Play className="w-4 h-4" /> {t('preview') || 'Preview'}
                </button>
                <button 
                  onClick={() => setPreviewMode('code')}
                  className={cn("px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors", previewMode === 'code' ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-main")}
                >
                  <Code className="w-4 h-4" /> {t('code') || 'Code'}
                </button>
              </div>
            )}

            <button 
              onClick={() => setPreviewData(null)}
              className="p-2 text-muted hover:text-main rounded-full hover:bg-elevated transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden bg-elevated relative">
            {previewData.language === 'html' && previewMode === 'preview' ? (
              <iframe 
                srcDoc={previewData.code} 
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="w-full h-full overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-surface p-6 rounded-2xl border border-theme shadow-sm markdown-body prose dark:prose-invert max-w-none overflow-x-auto break-words">
                  <pre><code className={`language-${previewData.language}`}>{previewData.code}</code></pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
