import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Volume2, CheckCircle, XCircle, AlertTriangle, Lightbulb, ExternalLink } from 'lucide-react';
import { cn } from '../utils';

const elementColors: Record<string, string> = {
  text: 'bg-surface border-theme',
  strategy: 'bg-blue-500/10 border-blue-500/30',
  example: 'bg-green-500/10 border-green-500/30',
  exception: 'bg-orange-500/10 border-orange-500/30',
  mistake: 'bg-red-500/10 border-red-500/30',
};

const elementIcons: Record<string, any> = {
  strategy: Lightbulb,
  example: CheckCircle,
  exception: AlertTriangle,
  mistake: XCircle,
};

export default function LessonView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [elements, setElements] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!topicId) return;
    api.getLessonElements(topicId).then(setElements).catch(() => {
      setElements([
        { id: '1', element_type: 'text', content: { text: '## Present Simple Tense\n\nPresent Simple tense hozirgi oddiy zamon bo\'lib, odatiy harakatlarni ifodalaydi.', color: '#3b82f6' }, sort_order: 0 },
        { id: '2', element_type: 'example', content: { title: 'Misol', text: 'I **play** football every day.\nShe **reads** books in the evening.', color: '#22c55e' }, sort_order: 1 },
        { id: '3', element_type: 'strategy', content: { title: 'Strategiya', text: 'He/She/It uchun fe\'lga **-s** qo\'shiladi!', color: '#3b82f6' }, sort_order: 2 },
        { id: '4', element_type: 'exception', content: { title: 'Istisno', text: '**have** → **has** (He has a car)', color: '#f97316' }, sort_order: 3 },
        { id: '5', element_type: 'mistake', content: { title: 'Tez-tez xato', text: '❌ He play football\n✅ He **plays** football', color: '#ef4444' }, sort_order: 4 },
        { id: '6', element_type: 'quiz', content: { question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correct_index: 1, explanation: 'She uchun "goes" ishlatiladi' }, sort_order: 5 },
      ]);
    });
  }, [topicId]);

  const renderElement = (el: any) => {
    const { element_type, content, id } = el;
    
    switch (element_type) {
      case 'text':
        return (
          <div className="bg-surface border border-theme rounded-2xl p-4" style={{ borderLeftWidth: 4, borderLeftColor: content.color || '#3b82f6' }}>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{content.text}</div>
          </div>
        );
      
      case 'image':
        return (
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img src={content.url} alt={content.caption || ''} className="w-full" referrerPolicy="no-referrer" />
            {content.caption && <p className="p-3 text-sm text-muted bg-surface">{content.caption}</p>}
          </div>
        );
      
      case 'video':
        return (
          <div className="rounded-2xl overflow-hidden shadow-md bg-black">
            <video src={content.url} controls className="w-full" />
            {content.caption && <p className="p-3 text-sm text-muted bg-surface">{content.caption}</p>}
          </div>
        );
      
      case 'audio':
        return (
          <div className="bg-surface border border-theme rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-main">{content.caption || 'Audio'}</p>
              <audio src={content.url} controls className="w-full mt-2" />
            </div>
          </div>
        );

      case 'strategy': case 'example': case 'exception': case 'mistake': {
        const Icon = elementIcons[element_type] || Lightbulb;
        const bg = elementColors[element_type];
        return (
          <div className={cn("rounded-2xl p-4 border", bg)}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5" style={{ color: content.color }} />
              <h4 className="font-bold text-main">{content.title}</h4>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{content.text}</div>
          </div>
        );
      }

      case 'webview': {
        const iframeRef = React.createRef<HTMLIFrameElement>();
        const autoResize = () => {
          try {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentDocument) {
              const h = iframe.contentDocument.documentElement.scrollHeight;
              iframe.style.height = h + 'px';
            }
          } catch (e) {}
        };
        
        // Render JSX natively if missing HTML tags
        let finalHtml = content.html_code || '';
        if (finalHtml && !finalHtml.includes('<html') && (finalHtml.includes('import React') || finalHtml.includes('export default'))) {
          const cleanCode = finalHtml.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '');
          finalHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${cleanCode}
    if (typeof App !== 'undefined') {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    }
  </script>
</body>
</html>`;
        }

        return (
          <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden border-y border-theme shadow-md">
            <iframe
              ref={iframeRef}
              srcDoc={finalHtml}
              className="w-full border-none bg-white"
              style={{ minHeight: '80vh', height: '100%' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
              onLoad={autoResize}
            />
          </div>
        );
      }

      case 'quiz': {
        const answered = quizAnswers[id] !== undefined;
        const selected = quizAnswers[id];
        return (
          <div className="bg-surface border border-theme rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-main text-lg">🧩 Quiz</h4>
            <p className="text-main">{content.question}</p>
            <div className="space-y-2">
              {content.options?.map((opt: string, i: number) => {
                const isCorrect = i === content.correct_index;
                const isSelected = selected === i;
                return (
                  <button
                    key={i}
                    onClick={() => !answered && setQuizAnswers(p => ({ ...p, [id]: i }))}
                    disabled={answered}
                    className={cn(
                      "w-full p-3 rounded-xl text-left font-medium transition-all border",
                      !answered && "bg-elevated border-theme hover:border-primary/50",
                      answered && isCorrect && "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400",
                      answered && isSelected && !isCorrect && "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400",
                      answered && !isSelected && !isCorrect && "opacity-50 border-theme"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && content.explanation && (
              <div className={cn("p-3 rounded-xl text-sm", selected === content.correct_index ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400")}>
                {content.explanation}
              </div>
            )}
          </div>
        );
      }

      case 'link':
        return (
          <a href={content.url} target={content.is_webapp ? '_self' : '_blank'} rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-surface border border-theme rounded-2xl hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-main group-hover:text-primary transition-colors">{content.label || content.url}</span>
          </a>
        );

      case 'divider':
        return <hr className="border-theme my-2" />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2 animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 p-2 rounded-full hover:bg-elevated transition-colors text-main">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Orqaga</span>
      </button>
      
      {elements.map((el) => (
        <div key={el.id}>{renderElement(el)}</div>
      ))}
    </div>
  );
}
