import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import JSZip from 'jszip';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ComicReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comic, setComic] = useState<any>(null);
  const [showReader, setShowReader] = useState(false);
  const [extractedPages, setExtractedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // PDF state
  const [numPages, setNumPages] = useState<number>();
  const [pdfScale, setPdfScale] = useState(1);

  useEffect(() => {
    if (!id) return;
    api.getComic(id).then(setComic).catch(() => {});
  }, [id]);

  const startReading = async () => {
    setShowReader(true);
    if (!comic || !comic.pages || comic.pages.length === 0) return;

    const firstUrl = comic.pages[0].image_url;
    
    // Check if it's CBZ
    if (firstUrl.endsWith('.cbz') || firstUrl.includes('.cbz')) {
      setIsLoading(true);
      try {
        const res = await fetch(firstUrl);
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(blob);
        
        const images: string[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && relativePath.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i)) {
            images.push(relativePath);
          }
        });

        images.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        const blobUrls: string[] = [];
        for (const imgPath of images) {
          const imgData = await zip.file(imgPath)!.async('blob');
          blobUrls.push(URL.createObjectURL(imgData));
        }
        setExtractedPages(blobUrls);
      } catch (err) {
        console.error('CBZ load error', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!comic) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  const firstUrl = comic.pages?.[0]?.image_url || '';
  const isCbz = firstUrl.endsWith('.cbz') || firstUrl.includes('.cbz');
  const isPdf = firstUrl.endsWith('.pdf') || firstUrl.includes('.pdf');

  return (
    <div className="animate-in fade-in duration-500 min-h-screen">
      {!showReader && (
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 p-2 mb-4 rounded-full hover:bg-elevated text-main">
          <ArrowLeft className="w-5 h-5" /><span className="font-medium">Orqaga</span>
        </button>
      )}

      {!showReader ? (
        <div className="max-w-md mx-auto space-y-4 pb-8">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
            <img src={comic.cover_url} alt={comic.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-xl font-bold text-main">{comic.title}</h1>
          <p className="text-muted">{comic.description}</p>
          <button onClick={startReading} className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            📖 O'qishni boshlash
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto pb-10">
          <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-theme p-3 flex justify-between items-center mb-4">
            <button onClick={() => setShowReader(false)} className="bg-elevated text-main p-2 rounded-lg hover:bg-theme">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-main font-bold truncate max-w-[200px]">{comic.title}</h2>
            
            {isPdf ? (
              <div className="flex gap-2">
                 <button onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))} className="p-2 bg-elevated rounded-lg"><ZoomOut className="w-4 h-4 text-white" /></button>
                 <button onClick={() => setPdfScale(s => Math.min(3, s + 0.2))} className="p-2 bg-elevated rounded-lg"><ZoomIn className="w-4 h-4 text-white" /></button>
              </div>
            ) : <div className="w-10"></div>}
          </div>

          <div className="space-y-0 relative min-h-[50vh] flex flex-col items-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-black/50 rounded-xl z-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-white font-bold text-lg animate-pulse">Komiks yuklanmoqda...</p>
              </div>
            )}
            
            {isCbz && !isLoading && extractedPages.map((url, i) => (
              <img key={i} src={url} alt={`Page ${i+1}`} className="w-full block" style={{ marginTop: '-1px' }} />
            ))}

            {isPdf && !isLoading && (
              <div className="flex flex-col items-center bg-white rounded-lg overflow-hidden w-full max-w-full">
                <Document 
                   file={firstUrl} 
                   onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                   loading={<div className="p-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}
                >
                  {Array.from(new Array(numPages || 0), (el, index) => (
                    <Page 
                      key={`page_${index + 1}`} 
                      pageNumber={index + 1} 
                      scale={pdfScale}
                      className="mb-2 shadow-lg max-w-full"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={screen.width < 768 ? screen.width - 20 : undefined}
                    />
                  ))}
                </Document>
              </div>
            )}

            {!isCbz && !isPdf && !isLoading && comic.pages?.map((page: any) => (
              <img key={page.id} src={page.image_url} alt={`Page ${page.page_number}`}
                className="w-full block" style={{ marginTop: '-1px' }} referrerPolicy="no-referrer" />
            ))}
          </div>
          
          {!isLoading && (
             <div className="text-center py-8">
               <p className="text-muted font-medium">— Tugadi —</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
