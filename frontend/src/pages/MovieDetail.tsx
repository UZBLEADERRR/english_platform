import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Play, Lock, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Pause, ExternalLink } from 'lucide-react';
import Hls from 'hls.js';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [movie, setMovie] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualities, setQualities] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);
  const { setIsNavbarHidden } = useAppStore();

  const controlsTimeoutRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.getMovie(id).then(setMovie).catch(() => {
      setMovie({ id, title: 'Sample Movie', description: 'A great movie', poster_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&h=1200', is_locked: true, is_18plus: false });
    });
  }, [id]);

  useEffect(() => {
    if (!videoRef.current || !showPlayer || !movie?.video_url) return;
    const url = movie.video_url;
    let hls: Hls | null = null;
    let savedTime = 0;
    
    try {
      const stored = localStorage.getItem(`movieProgress_${movie.id}`);
      if (stored) savedTime = parseFloat(stored);
    } catch(e){}

    const setupInitialTime = () => {
      if (savedTime > 0 && videoRef.current) {
        videoRef.current.currentTime = savedTime;
      }
    };

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({ autoStartLoad: true, maxMaxBufferLength: 30 });
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, (evt, data) => {
          const uniqueQualities = data.levels.map((l: any, i: number) => ({ index: i, height: l.height })).filter((v, i, a) => a.findIndex(t => (t.height === v.height)) === i);
          setQualities(uniqueQualities);
          setCurrentQuality(-1);
          setupInitialTime();
        });
        setHlsInstance(hls);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
        videoRef.current.addEventListener('loadedmetadata', setupInitialTime);
      }
    } else {
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', setupInitialTime);
    }

    return () => {
      if (hls) {
        hls.destroy();
        setHlsInstance(null);
      }
      if (videoRef.current) videoRef.current.removeEventListener('loadedmetadata', setupInitialTime);
    };
  }, [movie?.video_url, showPlayer]);

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) { setShowControls(false); setShowQualityMenu(false); setShowSpeedMenu(false); }
    }, 3500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (val: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const seekTo = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    try { localStorage.setItem(`movieProgress_${movie.id}`, time.toString()); } catch(e){}
  };

  const skip = (sec: number) => {
    if (!videoRef.current) return;
    seekTo(Math.max(0, Math.min(videoRef.current.currentTime + sec, duration)));
  };

  const changeQuality = (index: number) => {
    if (hlsInstance) { hlsInstance.currentLevel = index; setCurrentQuality(index); }
    setShowQualityMenu(false);
  };
  
  const changeSpeed = (rate: number) => {
    if (videoRef.current) { videoRef.current.playbackRate = rate; setPlaybackRate(rate); }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const doc = document as any;
    const isFS = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    if (!isFS) {
      if (container.requestFullscreen) container.requestFullscreen().catch(() => video.requestFullscreen?.());
      else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else if (container.msRequestFullscreen) container.msRequestFullscreen();
      else if (video.requestFullscreen) video.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleFakeFullscreen = () => {
    const newState = !isFakeFullscreen;
    setIsFakeFullscreen(newState);
    setIsNavbarHidden(newState);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    if (Math.floor(t) % 5 === 0) {
      try { localStorage.setItem(`movieProgress_${movie.id}`, t.toString()); } catch(e){}
    }
  };

  if (!movie) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const canWatch = (!movie.is_locked || user?.subscription === 'premium' || user?.subscription === 'ultra');
  const isUnderage = user?.age && user.age < 18;
  const isAgeRestricted = movie.is_18plus && isUnderage;

  const url = movie.video_url || '';
  const isDirectVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.m3u8');
  let embedUrl = url;
  if (url.includes('youtube.com/watch?v=')) embedUrl = url.replace('watch?v=', 'embed/');
  else if (url.includes('youtu.be/')) embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');

  // Webview parsing
  let finalHtml = movie.info_html || '';
  if (finalHtml && !finalHtml.includes('<html') && (finalHtml.includes('import React') || finalHtml.includes('export default'))) {
    const cleanCode = finalHtml.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '');
    finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div><script type="text/babel">${cleanCode} if (typeof App !== 'undefined') { const root = ReactDOM.createRoot(document.getElementById('root')); root.render(React.createElement(App)); }</script></body></html>`;
  }

  return (
    <div className="min-h-screen page-enter">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 p-2 mb-4 rounded-full hover:bg-elevated text-main">
        <ArrowLeft className="w-5 h-5" /><span className="font-medium">Orqaga</span>
      </button>

      <div className={cn("max-w-4xl mx-auto space-y-4 px-4 pb-12", isFakeFullscreen && "fixed inset-0 z-[500] bg-black max-w-none p-0 pb-0")}>
        {isAgeRestricted ? (
          <div className="relative aspect-[2/3] max-h-[400px] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl mx-auto ring-1 ring-white/10 flex items-center justify-center bg-surface">
            <div className="absolute inset-0 bg-red-900/20" />
            <div className="z-10 text-center p-6 bg-red-500/10 border border-red-500/30 rounded-3xl backdrop-blur-md max-w-[80%]">
              <Lock className="w-12 h-12 mx-auto mb-3 text-red-500" />
              <p className="font-extrabold text-main text-xl">18+ Kontent</p>
              <p className="text-sm text-white/80 mt-2">Sizning yoshingiz ushbu filmni ko'rish uchun yetarli emas.</p>
            </div>
          </div>
        ) : showPlayer && canWatch ? (
          <div ref={playerContainerRef} className={cn("relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl cursor-pointer group", isFakeFullscreen && "h-full rounded-none")} onClick={resetControlsTimer} onMouseMove={resetControlsTimer}>
            {isDirectVideo ? (
              <>
                <video
                  ref={videoRef} className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay} playsInline
                />
                <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-10">
                    {!isPlaying && <div className="p-5 rounded-full bg-black/40 backdrop-blur-md shadow-lg border border-white/20"><Play className="w-10 h-10 text-white fill-white ml-1" /></div>}
                  </button>
                  
                  {isFakeFullscreen && (
                    <button onClick={toggleFakeFullscreen} className="absolute top-4 left-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20">
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                  )}

                  <div className="relative z-20 p-4 space-y-3">
                    {/* Time & Progress */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-white/90">{formatTime(currentTime)}</span>
                      <input type="range" min={0} max={duration || 1} value={currentTime} step={0.1} onChange={e => seekTo(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none accent-primary focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" />
                      <span className="text-xs font-mono text-white/90">{formatTime(duration)}</span>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition-colors focus:outline-none">
                          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>
                          <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={e => handleVolumeChange(parseFloat(e.target.value))} className="w-16 h-1 hidden sm:block accent-white cursor-pointer" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 relative">
                        {/* Speed */}
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }} className="text-xs font-bold text-white px-2 py-1 bg-white/10 rounded-md hover:bg-white/20">{playbackRate}x</button>
                          {showSpeedMenu && (
                            <div className="absolute bottom-full right-0 mb-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex flex-col items-center shadow-xl">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                                <button key={r} onClick={(e) => { e.stopPropagation(); changeSpeed(r); }} className={`px-4 py-1.5 text-xs w-full hover:bg-white/10 ${playbackRate === r ? 'text-primary font-bold' : 'text-white'}`}>{r}x</button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quality */}
                        {qualities.length > 0 && (
                          <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }} className="text-xs font-bold text-white px-2 py-1 bg-white/10 rounded-md hover:bg-white/20">{currentQuality === -1 ? 'Auto' : qualities.find(q=>q.index===currentQuality)?.height+'p'}</button>
                            {showQualityMenu && (
                              <div className="absolute bottom-full right-0 mb-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex flex-col items-center shadow-xl min-w-[70px]">
                                {[...qualities].reverse().map(q => (
                                  <button key={q.index} onClick={(e) => { e.stopPropagation(); changeQuality(q.index); }} className={`px-4 py-1.5 text-xs w-full hover:bg-white/10 ${currentQuality === q.index ? 'text-primary font-bold' : 'text-white'}`}>{q.height}p</button>
                                ))}
                                <button onClick={(e) => { e.stopPropagation(); changeQuality(-1); }} className={`px-4 py-1.5 text-xs w-full hover:bg-white/10 border-t border-white/10 mt-1 pt-1 ${currentQuality === -1 ? 'text-primary font-bold' : 'text-white'}`}>Auto</button>
                              </div>
                            )}
                          </div>
                        )}

                        <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white hover:text-primary transition-colors hidden sm:block"><SkipBack className="w-5 h-5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white hover:text-primary transition-colors hidden sm:block"><SkipForward className="w-5 h-5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); toggleFakeFullscreen(); }} className={cn("text-white hover:text-primary transition-colors", isFakeFullscreen && "text-primary")}>
                           <Maximize className="w-5 h-5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white hover:text-primary transition-colors hidden sm:block">
                          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; fullscreen; encrypted-media" />
            )}
          </div>
        ) : (
          <div className="relative aspect-[2/3] max-h-[400px] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl mx-auto ring-1 ring-white/10">
            <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {movie.is_18plus && <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 rounded-lg text-sm font-bold text-white shadow-lg">18+</span>}
          </div>
        )}

        {!isFakeFullscreen && (
        <div className="space-y-4 px-1 pb-4">
          <h1 className="text-3xl font-extrabold text-main">{movie.title}</h1>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => window.open(movie.video_url, '_blank')}
              className="px-4 py-2 bg-surface border border-theme rounded-xl text-main text-sm font-bold hover:bg-elevated transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Tashqi brauzerda ochish
            </button>
          </div>
          
          {movie.info_html ? (
            <div className="-mx-4 md:mx-0 rounded-none md:rounded-3xl overflow-hidden border-y md:border border-theme shadow-xl">
              <iframe 
                srcDoc={finalHtml} 
                className="w-full border-none bg-white block"
                style={{ minHeight: '300px' }}
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={(e) => {
                  try {
                    const iframe = e.currentTarget;
                    if (iframe.contentDocument) iframe.style.height = iframe.contentDocument.documentElement.scrollHeight + 'px';
                  } catch(err) {}
                }}
              />
            </div>
          ) : (
            <p className="text-[#a1a1aa] leading-relaxed text-[15px]">{movie.description}</p>
          )}

          {isAgeRestricted ? (
            <div className="space-y-3 mt-4">
              <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                <Lock className="w-10 h-10 mx-auto mb-3 text-red-500" />
                <p className="font-extrabold text-main text-lg">Taqiqlangan</p>
                <p className="text-sm text-muted mt-1.5 px-4">Ushbu film faqat 18 yoshdan oshganlar uchun mo'ljallangan.</p>
              </div>
            </div>
          ) : canWatch ? (
            !showPlayer && (
              <button onClick={() => setShowPlayer(true)} className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-[0.98]">
                <Play className="w-6 h-6 fill-white" /> Kinoni ko'rish
              </button>
            )
          ) : (
            <div className="space-y-3 mt-4">
              <div className="p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-center">
                <Lock className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                <p className="font-extrabold text-main text-lg">Premium kontent</p>
                <p className="text-sm text-muted mt-1.5 px-4">Bu kinoni to'liqHD formatda ko'rish uchun Premium yoki Ultra tarifga o'ting! ✨</p>
              </div>
              <button onClick={() => navigate('/pricing')} className="w-full py-4 mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all">
                🌟 Premium sotib olish
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
