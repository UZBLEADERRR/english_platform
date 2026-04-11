import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Play, Music, X } from 'lucide-react';

export default function Songs() {
  const navigate = useNavigate();
  const { setIsNavbarHidden } = useAppStore();
  const [songs, setSongs] = useState<any[]>([]);
  const [activeSong, setActiveSong] = useState<any>(null);

  useEffect(() => {
    // Hide navbar — Songs is fullscreen
    setIsNavbarHidden(true);
    return () => setIsNavbarHidden(false);
  }, [setIsNavbarHidden]);

  useEffect(() => {
    api.get('/api/songs').then(setSongs).catch(() => {
      setSongs([
        { id: '1', title: 'Shape of You', artist: 'Ed Sheeran', cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', media_type: 'audio', media_url: '', lyrics_html: '<div style="padding:16px;font-family:sans-serif;"><h3>Shape of You - Ed Sheeran</h3><p style="color:#888;">Lyrics coming soon...</p></div>' },
        { id: '2', title: 'Perfect', artist: 'Ed Sheeran', cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop', media_type: 'audio', media_url: '', lyrics_html: '<div style="padding:16px;font-family:sans-serif;"><h3>Perfect - Ed Sheeran</h3><p style="color:#888;">Lyrics coming soon...</p></div>' },
      ]);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[50] bg-bg flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-surface/95 backdrop-blur-xl border-b border-theme flex items-center px-4 gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-main" />
        </button>
        <h1 className="text-lg font-bold text-main">🎵 Songs</h1>
      </div>

      {/* Songs grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          {songs.map(song => (
            <button key={song.id} onClick={() => setActiveSong(song)}
              className="bg-surface border border-theme rounded-2xl overflow-hidden text-left hover:shadow-lg transition-all group">
              <div className="aspect-square relative overflow-hidden">
                <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-10 h-10 text-white fill-white" />
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-main text-sm truncate">{song.title}</p>
                <p className="text-xs text-muted truncate">{song.artist}</p>
              </div>
            </button>
          ))}
        </div>

        {songs.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto text-muted mb-3" />
            <p className="text-muted">Hozircha qo'shiqlar yo'q</p>
          </div>
        )}
      </div>

      {/* Song detail view */}
      {activeSong && (
        <div className="fixed inset-0 z-[100] bg-bg page-enter flex flex-col">
          <div className="h-14 bg-surface/95 backdrop-blur-xl border-b border-theme flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Music className="w-4 h-4 text-primary shrink-0" />
              <h2 className="font-bold text-main text-sm truncate">{activeSong.title} — {activeSong.artist}</h2>
            </div>
            <button onClick={() => setActiveSong(null)} className="p-2 text-muted hover:text-main text-lg">✕</button>
          </div>
          <div className="flex-1 overflow-auto">
            {/* Player */}
            {activeSong.media_url && (
              <div className="p-4 bg-surface border-b border-theme">
                {activeSong.media_type === 'video' ? (
                  <video src={activeSong.media_url} controls className="w-full rounded-xl" />
                ) : (
                  <audio src={activeSong.media_url} controls className="w-full" />
                )}
              </div>
            )}
            {/* Lyrics webview */}
            {activeSong.lyrics_html && (
              <iframe 
                srcDoc={activeSong.lyrics_html} 
                className="w-full border-none bg-white"
                style={{ minHeight: 'calc(100dvh - 120px)' }}
                sandbox="allow-scripts allow-same-origin"
                onLoad={(e) => {
                  try {
                    const iframe = e.currentTarget;
                    if (iframe.contentDocument) {
                      iframe.style.height = iframe.contentDocument.documentElement.scrollHeight + 'px';
                    }
                  } catch(err) {}
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
