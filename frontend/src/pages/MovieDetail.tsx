import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Play, Lock, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Pause } from 'lucide-react';
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
  const controlsTimeoutRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.getMovie(id).then(setMovie).catch(() => {
      setMovie({ id, title: 'Sample Movie', description: 'A great movie for learning English', poster_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&h=1200&fit=crop', is_locked: true, is_18plus: false });
    });
  }, [id]);

  useEffect(() => {
    if (!videoRef.current || !showPlayer || !movie?.video_url) return;
    const url = movie.video_url;
    let hls: Hls | null = null;

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({ autoStartLoad: true, maxMaxBufferLength: 30 });
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url; // Safari native HLS
      }
    } else {
      videoRef.current.src = url; // Standard mp4/webm
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [movie?.video_url, showPlayer]);

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
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
  };

  const skip = (sec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + sec, duration));
  };

  const toggleFullscreen = () => {
    const el = playerContainerRef.current as any;
    if (!el) return;
    const doc = document as any;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (videoRef.current) {
        // iOS Safari fallback: fullscreen on video element
        const v = videoRef.current as any;
        if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!movie) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const canWatch = !movie.is_locked || user?.subscription === 'premium' || user?.subscription === 'ultra';
  const url = movie.video_url || '';
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  const isDirectVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.m3u8');

  let embedUrl = url;
  if (url.includes('youtube.com/watch?v=')) {
    embedUrl = url.replace('watch?v=', 'embed/');
  } else if (url.includes('youtu.be/')) {
    embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
  }

  return (
    <div className="min-h-screen page-enter">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 p-2 mb-4 rounded-full hover:bg-elevated text-main">
        <ArrowLeft className="w-5 h-5" /><span className="font-medium">Orqaga</span>
      </button>

      <div className="max-w-2xl mx-auto space-y-4">
        {showPlayer && canWatch ? (
          <div
            ref={playerContainerRef}
            className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-xl cursor-pointer group"
            onClick={resetControlsTimer}
          >
            {isDirectVideo ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                  playsInline
                />
                {/* Custom Controls Overlay */}
                <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Center play button */}
                  <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-10">
                    {!isPlaying && (
                      <div className="p-5 rounded-full bg-white/20 backdrop-blur-sm">
                        <Play className="w-10 h-10 text-white fill-white" />
                      </div>
                    )}
                  </button>

                  {/* Bottom controls */}
                  <div className="relative z-20 p-3 space-y-2">
                    {/* Progress bar */}
                    <input
                      type="range" min={0} max={duration || 1} value={currentTime} step={0.1}
                      onChange={e => seekTo(parseFloat(e.target.value))}
                      className="w-full h-1 accent-primary cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button onClick={togglePlay} className="p-1 text-white">
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button onClick={() => skip(-10)} className="p-1 text-white"><SkipBack className="w-4 h-4" /></button>
                        <button onClick={() => skip(10)} className="p-1 text-white"><SkipForward className="w-4 h-4" /></button>
                        <span className="text-xs text-white/80 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className="p-1 text-white">
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                          onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-16 h-1 accent-white cursor-pointer"
                        />
                        <button onClick={toggleFullscreen} className="p-1 text-white">
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
          <div className="relative aspect-[2/3] max-h-[400px] rounded-2xl overflow-hidden shadow-xl mx-auto">
            <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {movie.is_18plus && <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 rounded-lg text-sm font-bold text-white">18+</span>}
          </div>
        )}

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-main">{movie.title}</h1>
          
          {/* Movie info webview (if exists) */}  
          {movie.info_html ? (
            <div className="rounded-2xl overflow-hidden border border-theme shadow-md">
              <iframe 
                srcDoc={movie.info_html} 
                className="w-full border-none bg-white"
                style={{ minHeight: '200px' }}
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
            </div>
          ) : (
            <p className="text-muted leading-relaxed">{movie.description}</p>
          )}

          {canWatch ? (
            !showPlayer && (
              <button onClick={() => setShowPlayer(true)} className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all">
                <Play className="w-5 h-5" /> ▶ Kinoni ko'rish
              </button>
            )
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                <Lock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="font-bold text-main">Premium kontent</p>
                <p className="text-sm text-muted mt-1">Bu kinoni ko'rish uchun Premium yoki Ultra sotib oling</p>
              </div>
              <button onClick={() => navigate('/pricing')} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                Premium sotib olish ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
