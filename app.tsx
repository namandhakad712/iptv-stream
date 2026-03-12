import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- MINIMALIST MODERN CSS ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-base: #000000;
    --panel-bg: rgba(10, 10, 12, 0.65);
    --panel-border: rgba(255, 255, 255, 0.08);
    --text-main: #f3f3f3;
    --text-muted: #999999;
    --accent: #ffffff;
    --accent-hover: rgba(255, 255, 255, 0.1);
    --glass-blur: blur(24px);
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-main);
    font-family: 'Outfit', sans-serif;
    margin: 0;
    overflow: hidden; 
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

  .glass-panel {
    background: var(--panel-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-right: 1px solid var(--panel-border);
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .resizer {
    position: absolute;
    right: -4px;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
    z-index: 50;
    transition: background 0.2s;
  }
  .resizer:hover, .resizer.dragging {
    background: rgba(255, 255, 255, 0.2);
  }

  .input-minimal {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-main);
    border-radius: 8px;
    padding: 10px 14px;
    outline: none;
    transition: all 0.2s ease;
  }
  .input-minimal:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .channel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
    padding-bottom: 20px;
  }

  .channel-card {
    border-radius: 8px;
    transition: all 0.15s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.03);
    background: rgba(255, 255, 255, 0.02);
  }
  .channel-card:hover {
    background: var(--accent-hover);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .channel-card.active {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }
  
  .channel-card.focused {
    border-color: rgba(255, 255, 255, 0.8);
    transform: scale(1.02);
    background: rgba(255, 255, 255, 0.1);
    z-index: 10;
  }

  .ui-layer {
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .ui-idle .ui-layer {
    opacity: 0;
    transform: translateX(-20px);
    pointer-events: none;
  }

  .loader-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.2);
    border-bottom-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .toggle-switch {
    appearance: none; width: 34px; height: 18px; background: rgba(255,255,255,0.2); 
    border-radius: 9px; position: relative; cursor: pointer; outline: none; transition: 0.2s;
  }
  .toggle-switch:checked { background: #4ade80; }
  .toggle-switch::after {
    content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; 
    background: #fff; border-radius: 50%; transition: 0.2s;
  }
  .toggle-switch:checked::after { left: 18px; background: #000; }

  /* Custom Range Slider for Volume */
  .vol-slider {
    -webkit-appearance: none;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    outline: none;
  }
  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .vol-slider::-webkit-slider-thumb:hover {
    transform: scale(1.3);
  }
`;

const HLS_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js';

// We load sources purely dynamically from IPTV-Org Open API if empty.

const RENDER_LIMIT = 400;

// Cookie Persistence Utilities
const setCookie = (name: string, value: any, days = 365) => {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) + ";" + expires + ";path=/";
};

const getCookie = (name: string, defaultValue: any = null) => {
  const cname = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cname) === 0) {
      try {
        return JSON.parse(c.substring(cname.length, c.length));
      } catch(e) {
        return c.substring(cname.length, c.length);
      }
    }
  }
  return defaultValue;
};

// Robust Country Decoder & Name Mapper
const getCountryDetails = (code) => {
  if (!code || typeof code !== 'string') return { flagCode: null, flag: '🌐', name: 'Global / Int.' };
  let cleanCode = code.trim().toUpperCase();

  if (cleanCode.length === 2) {
    const flag = String.fromCodePoint(cleanCode.charCodeAt(0) + 127397, cleanCode.charCodeAt(1) + 127397);
    const flagCode = cleanCode.toLowerCase();
    try {
      // Precise Emoji conversion using Regional Indicator Symbols
      const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(cleanCode);
      return { flagCode, flag, name: name || cleanCode };
    } catch (e) {
      return { flagCode, flag, name: cleanCode };
    }
  }
  // Fallback for non-standard country tags
  return { flagCode: null, flag: '📺', name: code.charAt(0).toUpperCase() + code.slice(1).toLowerCase() };
};

// --- COMPONENTS ---

const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Search: (props: any) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  TV: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>,
  Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Play: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Pause: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>,
  Volume: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>,
  Mute: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>,
  MenuDots: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>,
  Database: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
  Folder: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
  Globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Type: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>,
  Radio: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>,
  PiP: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="13" y="13" width="6" height="4"></rect></svg>,
  Cast: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><line x1="2" y1="20" x2="2.01" y2="20"></line></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const VideoPlayer = ({ channel, onStatus, setAvailableQualities, currentQuality, videoRef, setIsPlaying, dataSaver }: any) => {
  const hlsRef = useRef(null);

  useEffect(() => {
    if (!(window as any).Hls) {
      const script = document.createElement('script');
      script.src = HLS_URL;
      script.async = true;
      script.onload = initPlayer;
      document.head.appendChild(script);
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (!channel || !channel.url) {
        onStatus('STANDBY');
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      onStatus('BUFFERING');
      setAvailableQualities([]);

      if (hlsRef.current) hlsRef.current.destroy();

      if ((window as any).Hls && (window as any).Hls.isSupported()) {
        const Hls = (window as any).Hls;
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;

        hls.loadSource(channel.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (e: any, data: any) => {
          video.play().then(() => {
            onStatus('PLAYING');
            setIsPlaying(true);
          }).catch(() => {
            onStatus('PAUSED - CLICK TO PLAY');
            setIsPlaying(false);
          });

          if (dataSaver && data.levels && data.levels.length > 0) {
            hls.autoLevelCapping = 0;
          }

          const levels = data.levels.map((l, idx) => ({
            id: idx,
            label: l.height ? `${l.height}p (${Math.round(l.bitrate / 1000)} kbps)` : `${Math.round(l.bitrate / 1000)} kbps`
          }));
          setAvailableQualities([{ id: -1, label: 'Auto (Adaptive)' }, ...levels]);
        });

        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('Network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('Media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                onStatus('STREAM UNAVAILABLE');
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.addEventListener('loadedmetadata', () => {
          video.play().then(() => {
            onStatus('PLAYING');
            setIsPlaying(true);
          }).catch(() => {
            onStatus('PAUSED - CLICK TO PLAY');
            setIsPlaying(false);
          });
        });
      }
    }

    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [channel, onStatus, setAvailableQualities, videoRef, setIsPlaying]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    vid.addEventListener('play', handlePlay);
    vid.addEventListener('pause', handlePause);
    return () => {
      vid.removeEventListener('play', handlePlay);
      vid.removeEventListener('pause', handlePause);
    }
  }, [videoRef, setIsPlaying]);

  useEffect(() => {
    if (hlsRef.current && currentQuality !== undefined) {
      hlsRef.current.currentLevel = parseInt(currentQuality);
    }
  }, [currentQuality]);

  return (
    <video
      ref={videoRef}
      className={`w-full h-full object-cover absolute inset-0 bg-black ${dataSaver ? 'z-[1]' : 'z-0'}`}
      crossOrigin="anonymous"
      autoPlay
      playsInline
      onClick={(e) => {
        const target = e.target as HTMLVideoElement;
        target.paused ? target.play() : target.pause()
      }}
    />
  );
};

const AmbilightEngine = ({ videoRef, active }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !videoRef.current) return;
    let animId: number;
    
    const draw = () => {
      if (canvasRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      animId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animId);
  }, [active, videoRef]);

  if (!active) return null;
  
  return (
    <canvas 
      ref={canvasRef} 
      width="64" height="64" 
      className="absolute inset-0 w-full h-full object-cover opacity-80 blur-[80px] saturate-[2.5] mix-blend-screen scale-110 pointer-events-none ui-layer transition-opacity duration-1000 z-[-1]"
    />
  );
};

const SearchableSelect = ({ options, value, onChange, placeholder, icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const term = opt.searchLabel || (typeof opt.label === 'string' ? opt.label : '');
    return term.toLowerCase().includes(search.toLowerCase());
  });

  const selectedOpt = options.find((o: any) => o.value === value);

  return (
    <div className={`relative w-full text-sm ${isOpen ? 'z-50' : 'z-10'}`} ref={wrapperRef}>
      <div
        className="input-minimal w-full flex justify-between items-center cursor-pointer select-none gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate text-gray-300">
          {icon}
          <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        </div>
        <Icons.ChevronDown />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1c] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-2 border-b border-[rgba(255,255,255,0.05)] sticky top-0 bg-[#1a1a1c]">
            <input
              type="text"
              className="w-full bg-black/50 border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-white text-sm outline-none focus:border-white/30"
              placeholder="Filter list..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            <div
              className={`px-3 py-2 cursor-pointer rounded hover:bg-white/10 ${value === '' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
            >
              [ Reset Filter ]
            </div>
            {filteredOptions.map((opt, i) => (
              <div
                key={i}
                className={`px-3 py-2 cursor-pointer rounded hover:bg-white/10 truncate ${value === opt.value ? 'bg-white/10 text-white' : 'text-gray-300'}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
              >
                {opt.label}
              </div>
            ))}
            {filteredOptions.length === 0 && <div className="p-3 text-center text-gray-500">No matches found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [sources, setSources] = useState<any[]>(() => {
    const saved = getCookie('streamos_sources');
    return saved || [];
  });

  const [sourceCache, setSourceCache] = useState<any>({});
  const [loadingState, setLoadingState] = useState(false);
  const [filters, setFilters] = useState(() => getCookie('streamos_filters', { type: 'all', value: '', search: '' }));
  const [activeChannel, setActiveChannel] = useState<any>(() => {
    const willAutoResume = getCookie('streamos_autoResume', true);
    return willAutoResume ? getCookie('streamos_activeChannel', null) : null;
  });
  const [playerStatus, setPlayerStatus] = useState('STANDBY');

  const [isIdle, setIsIdle] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => getCookie('streamos_sidebarWidth', 480));
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [countryMap, setCountryMap] = useState<any>({});
  const [worldCountriesList, setWorldCountriesList] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3,name,timezones')
      .then(res => res.json())
      .then(data => {
        const map: any = {};
        const list: any[] = [];
        data.forEach((c: any) => {
          const cca2 = c.cca2?.toUpperCase();
          if (!cca2) return;
          const name = c.name?.common;
          const tz = c.timezones && c.timezones.length > 0 ? c.timezones[0] : null;
          if (c.cca3) map[c.cca3.toUpperCase()] = cca2;
          if (name) map[name.toUpperCase()] = cca2;
          list.push({ code: cca2, name: name, tz });
        });
        setCountryMap(map);
        setWorldCountriesList(list);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Dynamic open-source playlist fetching if the user has no sources configured
    if (sources.length === 0 && !getCookie('streamos_sources')) {
      fetch('https://iptv-org.github.io/api/categories.json')
        .then(r => r.json())
        .then(data => {
           const openSourceLists = data.filter((c:any) => c.name).map((cat: any) => ({
              id: `iptv_${cat.id}`,
              label: `IPTV-Org (${cat.name})`,
              url: `https://iptv-org.github.io/iptv/categories/${cat.id}.m3u`,
              active: true,
              custom: false
           }));
           openSourceLists.unshift(
             { id: 'iptv_global', label: 'IPTV-Org (Global Master)', url: 'https://iptv-org.github.io/iptv/index.m3u', active: true, custom: false },
             { id: 'f_main', label: 'Free-TV (Master Playlist)', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', active: true, custom: false },
             { id: 'p_all', label: 'Pluto TV (Global Aggregation)', url: 'https://i.mjh.nz/PlutoTV/all.m3u8', active: true, custom: false },
             { id: 'plex_all', label: 'Plex Live TV (Global Aggregation)', url: 'https://i.mjh.nz/Plex/all.m3u8', active: true, custom: false },
             { id: 's_all', label: 'Samsung TV Plus (Global Aggregation)', url: 'https://i.mjh.nz/SamsungTVPlus/all.m3u8', active: true, custom: false },
             { id: 'roku_all', label: 'Roku Channel (Global Aggregation)', url: 'https://i.mjh.nz/Roku/all.m3u8', active: true, custom: false },
             { id: 'tubi_all', label: 'Tubi TV (Global Aggregation)', url: 'https://i.mjh.nz/Tubi/all.m3u8', active: true, custom: false },
             { id: 'stirr_all', label: 'Stirr TV (Global Aggregation)', url: 'https://i.mjh.nz/Stirr/all.m3u8', active: true, custom: false }
           );
           setSources(openSourceLists);
        })
        .catch(console.error);
    }
  }, [sources.length]);

  const calculateLocalTime = (tzString: string) => {
    if (!tzString || !tzString.includes('UTC')) return '';
    if (tzString === 'UTC') return new Date().toLocaleTimeString([], {timeZone: 'UTC', hour:'2-digit', minute:'2-digit'});
    const match = tzString.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (!match) return '';
    const sign = match[1] === '+' ? 1 : -1;
    const offsetMs = sign * ((parseInt(match[2], 10) * 60) + parseInt(match[3], 10)) * 60 * 1000;
    
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + offsetMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Settings & Tools States
  const [showSettings, setShowSettings] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<any>([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [screenshotMsg, setScreenshotMsg] = useState('');
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [settingsTab, setSettingsTab] = useState('sources');

  // Video Controls State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => getCookie('streamos_volume', 1));
  const [isMuted, setIsMuted] = useState(() => getCookie('streamos_isMuted', false));
  const [autoResume, setAutoResume] = useState(() => getCookie('streamos_autoResume', true));
  const [dataSaver, setDataSaver] = useState(() => getCookie('streamos_dataSaver', false));
  const [ambilight, setAmbilight] = useState(() => getCookie('streamos_ambilight', true));
  const [healthCache, setHealthCache] = useState<any>({});

  const idleTimer = useRef<any>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);
    // Remove default mobile touch highlights
    document.head.insertAdjacentHTML('beforeend', `<style> * { -webkit-tap-highlight-color: transparent; } </style>`);
    return () => { document.head.removeChild(styleSheet); };
  }, []);

  useEffect(() => { setCookie('streamos_sources', sources); }, [sources]);
  useEffect(() => { setCookie('streamos_filters', filters); }, [filters]);
  useEffect(() => { setCookie('streamos_sidebarWidth', sidebarWidth); }, [sidebarWidth]);
  useEffect(() => { setCookie('streamos_volume', volume); }, [volume]);
  useEffect(() => { setCookie('streamos_isMuted', isMuted); }, [isMuted]);
  useEffect(() => { setCookie('streamos_autoResume', autoResume); }, [autoResume]);
  useEffect(() => { setCookie('streamos_dataSaver', dataSaver); }, [dataSaver]);
  useEffect(() => { setCookie('streamos_ambilight', ambilight); }, [ambilight]);
  useEffect(() => { setCookie('streamos_activeChannel', activeChannel); }, [activeChannel]);

  const fetchWithFallback = async (url: string) => {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch (err) {
      console.warn(`Direct fetch failed for ${url}, trying proxy...`);
    }
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) return await proxyRes.text();
    } catch (proxyErr) { }
    throw new Error(`Failed to load data from ${url}`);
  };

  useEffect(() => {
    const syncPlaylists = async () => {
      const activeSources = sources.filter(s => s.active);
      const toFetch = activeSources.filter(s => !sourceCache[s.id]);
      if (toFetch.length === 0) return;

      setLoadingState(true);
      const newCacheData = {};

      await Promise.all(toFetch.map(async (source) => {
        try {
          const text = await fetchWithFallback(source.url);
          const lines = text.split(/\r?\n/);
          const parsedChannels = [];
          let currentChan = null;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXTINF:')) {
              const name = line.split(',').pop().trim() || 'Unknown';

              const countryMatch = line.match(/tvg-country="([^"]*)"/i);
              const categoryMatch = line.match(/group-title="([^"]*)"/i);
              const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
              const languageMatch = line.match(/tvg-language="([^"]*)"/i);

              let rawCode = countryMatch ? countryMatch[1].split(/[,;]/)[0].trim().toUpperCase() : '';
              if (!rawCode && categoryMatch) {
                const groupTitle = categoryMatch[1].trim().toUpperCase();
                if (groupTitle.length === 2 && /^[A-Z]{2}$/.test(groupTitle)) {
                  rawCode = groupTitle;
                }
              }

              const category = categoryMatch ? categoryMatch[1].trim() : '';
              const language = languageMatch ? languageMatch[1].trim() : '';
              const logo = logoMatch ? logoMatch[1].trim() : null;

              currentChan = {
                id: `${source.id}-${i}`,
                sourceId: source.id,
                name,
                rawCode,
                category,
                language,
                logo
              };
            } else if (line && !line.startsWith('#')) {
              if (currentChan) {
                currentChan.url = line.trim();
                parsedChannels.push(currentChan);
                currentChan = null;
              }
            }
          }
          newCacheData[source.id] = parsedChannels;
        } catch (e) {
          console.error(`Error processing source ${source.label}:`, e);
          newCacheData[source.id] = [];
        }
      }));

      setSourceCache(prev => ({ ...prev, ...newCacheData }));
      setLoadingState(false);
    };

    syncPlaylists();
  }, [sources, sourceCache]);

  const allChannels = useMemo(() => {
    return sources
      .filter(s => s.active && sourceCache[s.id])
      .flatMap(s => sourceCache[s.id].map(c => {
         const fallbackMap: any = { 'UK': 'GB', 'USA': 'US', 'GLOBAL': 'INT' };
         // Dynamic mapping with fetched map
         const finalCode = fallbackMap[c.rawCode] || countryMap[c.rawCode] || c.rawCode;
         return { ...c, countryCode: finalCode };
      }));
  }, [sources, sourceCache, countryMap]);

  const meta = useMemo(() => {
    const uniqueCountryCodes = new Set();
    const uniqueCategories = new Set();
    const uniqueLanguages = new Set();
    const uniqueSources = new Set();

    allChannels.forEach((c: any) => {
      if (c.countryCode) uniqueCountryCodes.add(c.countryCode);
      if (c.category) uniqueCategories.add(c.category);
      if (c.language) uniqueLanguages.add(c.language);
      if (c.sourceId) uniqueSources.add(c.sourceId);
    });

    const baseCountries = new Set(uniqueCountryCodes);
    worldCountriesList.forEach(wc => baseCountries.add(wc.code));

    const processedCountries = Array.from(baseCountries)
      .map((code: any) => {
        const details = getCountryDetails(code);
        return { 
          value: code, 
          searchLabel: `${details.name} ${code}`,
          label: (
            <div className="flex items-center gap-2">
              {details.flagCode ? <img src={`https://flagcdn.com/w20/${details.flagCode}.png`} alt={details.name} className="w-4 h-auto rounded-[1px]" /> : <span>{details.flag}</span>}
              <span className="truncate">{details.name}</span>
            </div>
          )
        };
      })
      .sort((a: any, b: any) => a.searchLabel.localeCompare(b.searchLabel));

    const processedCategories = Array.from(uniqueCategories)
      .filter(c => c)
      .map(c => ({ value: c, label: c as string }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label));

    const processedLanguages = Array.from(uniqueLanguages)
      .filter(l => l)
      .map(l => ({ value: l, label: l as string }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label));

    const processedSources = Array.from(uniqueSources)
      .map((s: any) => {
        const srcObj = sources.find((src: any) => src.id === s);
        return { value: s, label: srcObj ? srcObj.label : s as string };
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label));

    return { 
      countries: processedCountries, 
      categories: processedCategories,
      languages: processedLanguages,
      sources: processedSources
    };
  }, [allChannels, sources]);

  const filteredChannels = useMemo(() => {
    if (allChannels.length === 0) return [];
    return allChannels.filter((c: any) => {
      // Dynamic Match Filters
      if (filters.type === 'category' && filters.value && c.category !== filters.value) return false;
      if (filters.type === 'country' && filters.value && c.countryCode !== filters.value) return false;
      if (filters.type === 'language' && filters.value && c.language !== filters.value) return false;
      if (filters.type === 'source' && filters.value && c.sourceId !== filters.value) return false;

      if (filters.search) {
        const term = filters.search.toLowerCase();
        const countryName = getCountryDetails(c.countryCode).name.toLowerCase();

        const matchName = c.name.toLowerCase().includes(term);
        const matchCat = c.category.toLowerCase().includes(term);
        const matchCountryCode = c.countryCode.toLowerCase().includes(term);
        const matchCountryName = countryName.includes(term);

        if (!matchName && !matchCat && !matchCountryCode && !matchCountryName) return false;
      }
      return true;
    });
  }, [allChannels, filters]);

  const displayedChannels = filteredChannels.slice(0, RENDER_LIMIT);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      let newWidth = e.clientX;
      if (newWidth < 320) newWidth = 320;
      if (newWidth > window.innerWidth * 0.8) newWidth = window.innerWidth * 0.8;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const resetIdle = () => {
      if (isDragging.current || showSettings || controlsExpanded) return;
      setIsIdle(false);
      clearTimeout(idleTimer.current);
      if (activeChannel && playerStatus === 'PLAYING') {
        idleTimer.current = setTimeout(() => setIsIdle(true), 5000);
      }
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);

    resetIdle();
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      clearTimeout(idleTimer.current);
    };
  }, [activeChannel, playerStatus, showSettings, controlsExpanded]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSettings) return;
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'SELECT') return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setIsIdle(false);
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, displayedChannels.length - 1);
          document.getElementById(`channel-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsIdle(false);
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          document.getElementById(`channel-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        setActiveChannel(displayedChannels[focusedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedChannels, focusedIndex, showSettings]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleScreenshot = () => {
    const video = videoRef.current;
    if (!video || playerStatus !== 'PLAYING') {
      setScreenshotMsg('No active stream playing.');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `StreamOS_Capture_${Date.now()}.png`;
      a.click();
      setScreenshotMsg('Screenshot saved successfully!');
    } catch (err) {
      console.error(err);
      setScreenshotMsg('CORS Error: Stream provider blocks canvas capture.');
    }
    setTimeout(() => setScreenshotMsg(''), 4000);
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && (videoRef.current as any).requestPictureInPicture) {
        await (videoRef.current as any).requestPictureInPicture();
      }
    } catch(err) {
      console.error(err);
      setScreenshotMsg('PiP not supported or blocked.');
      setTimeout(() => setScreenshotMsg(''), 4000);
    }
  };

  const requestCast = () => {
    if (!videoRef.current) return;
    if ((videoRef.current as any).webkitShowPlaybackTargetPicker) {
      (videoRef.current as any).webkitShowPlaybackTargetPicker();
    } else {
       setScreenshotMsg('Native Cast requires Safari / Chrome extension.');
       setTimeout(() => setScreenshotMsg(''), 4000);
    }
  };

  const pingHealth = async (e: any, channel: any) => {
    e.stopPropagation();
    if (healthCache[channel.id] === 'checking') return;
    
    setHealthCache((prev: any) => ({...prev, [channel.id]: 'checking'}));
    try {
      await fetch(channel.url, { method: 'HEAD', mode: 'no-cors' });
      setHealthCache((prev: any) => ({...prev, [channel.id]: 'online'}));
    } catch (err) {
      setHealthCache((prev: any) => ({...prev, [channel.id]: 'offline'}));
    }
  };

  const toggleSource = (id) => {
    setSources(sources.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteSource = (id) => {
    setSources(sources.filter(s => s.id !== id));
    setSourceCache(prev => {
      const nc = { ...prev };
      delete nc[id];
      return nc;
    });
  };

  const addManualSource = (e) => {
    e.preventDefault();
    if (!newSourceUrl || !newSourceLabel) return;
    const newSrc = {
      id: `custom_${Date.now()}`,
      label: newSourceLabel,
      url: newSourceUrl,
      active: true,
      custom: true
    };
    setSources([...sources, newSrc]);
    setNewSourceLabel('');
    setNewSourceUrl('');
  };

  const activeSourceCount = sources.filter((s: any) => s.active).length;

  const typeOptions = [
    { value: 'all', label: 'All Channels' },
    { value: 'category', label: 'By Category' },
    { value: 'language', label: 'By Language' },
    { value: 'country', label: 'By Country' },
    { value: 'source', label: 'By Source' }
  ];

  const getOptionsForType = () => {
    switch(filters.type) {
      case 'category': return meta.categories;
      case 'language': return meta.languages;
      case 'country': return meta.countries;
      case 'source': return meta.sources;
      default: return [];
    }
  };

  const getIconForType = (typeVal: string) => {
     switch(typeVal) {
       case 'category': return <Icons.Folder />;
       case 'language': return <Icons.Type />;
       case 'country': return <Icons.Globe />;
       case 'source': return <Icons.Radio />;
       default: return <Icons.Database />;
     }
  };

  return (
    <div className={`w-screen h-screen relative bg-black flex ${isIdle ? 'ui-idle' : ''}`}>

      {/* 1. BACKGROUND VIDEO LAYER */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center p-0 md:p-8">
        <div className={`relative w-full h-full ${!ambilight || isMobile ? '' : 'rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]'}`}>
          <AmbilightEngine videoRef={videoRef} active={ambilight && !isMobile && playerStatus === 'PLAYING'} />
          <VideoPlayer
            channel={activeChannel}
            onStatus={setPlayerStatus}
            setAvailableQualities={setAvailableQualities}
            currentQuality={selectedQuality}
            videoRef={videoRef}
            setIsPlaying={setIsPlaying}
            dataSaver={dataSaver}
          />
        </div>
      </div>

      <div className={`absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent pointer-events-none z-0 ui-layer transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

      {/* Main Status OSD */}
      {!activeChannel ? (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <Icons.TV />
          <span className="ml-4 text-3xl font-light tracking-wide opacity-50">Select a stream</span>
        </div>
      ) : (
        <div className="absolute top-8 right-8 z-10 flex flex-col items-end pointer-events-none drop-shadow-lg ui-layer">
          <div className="text-3xl font-medium shadow-black drop-shadow-md">{activeChannel.name}</div>
          <div className="text-sm uppercase tracking-widest flex items-center gap-2 mt-1 drop-shadow-md text-white/80">
            {activeChannel.countryCode && worldCountriesList.find(c => c.code === activeChannel.countryCode)?.tz && (
               <span className="mr-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-xs border border-white/20 shadow-sm flex items-center">
                 <Icons.Globe className="inline w-3 h-3 mr-1.5" />
                 Local Time: {calculateLocalTime(worldCountriesList.find(c => c.code === activeChannel.countryCode)?.tz)}
               </span>
            )}
            {playerStatus === 'PLAYING' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>}
            <span className={playerStatus === 'STREAM UNAVAILABLE' ? 'text-red-400' : 'text-white/80'}>{playerStatus}</span>
          </div>
        </div>
      )}

      {/* Floating Minimal Controls (Bottom Right) */}
      {activeChannel && (
        <div
          className={`absolute bottom-8 right-8 z-40 flex flex-row-reverse items-center gap-3 transition-all duration-700 ${isIdle && !controlsExpanded ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'}`}
          onMouseEnter={() => { clearTimeout(idleTimer.current); setIsIdle(false); }}
          onMouseLeave={() => {
            if (playerStatus === 'PLAYING' && !controlsExpanded) {
              idleTimer.current = setTimeout(() => setIsIdle(true), 5000);
            }
          }}
        >
          <button
            onClick={() => setControlsExpanded(!controlsExpanded)}
            className={`w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${controlsExpanded ? 'bg-white/20 border-white/30 rotate-90' : 'bg-black/50 border-white/10 rotate-0'}`}
            title="Video Controls"
          >
            <Icons.MenuDots />
          </button>

          <div className={`flex items-center bg-black/60 backdrop-blur-2xl border border-white/10 py-3 rounded-full shadow-2xl transition-all duration-500 overflow-hidden ${controlsExpanded ? 'opacity-100 translate-x-0 px-6 gap-5 max-w-[500px]' : 'opacity-0 translate-x-12 px-0 gap-0 max-w-0 border-transparent pointer-events-none'}`}>
            <button onClick={togglePlay} className="text-white hover:text-green-400 transition transform hover:scale-110">
              {isPlaying ? <Icons.Pause /> : <Icons.Play />}
            </button>

            <div className={`w-px h-5 bg-white/20 ${isMobile ? 'hidden' : 'block'}`}></div>

            <div className={`flex items-center gap-3 group ${isMobile ? 'hidden' : 'flex'}`}>
              <button onClick={toggleMute} className="text-white hover:text-blue-400 transition transform hover:scale-110">
                {isMuted || volume === 0 ? <Icons.Mute /> : <Icons.Volume />}
              </button>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="vol-slider w-24 opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>

            <div className="w-px h-5 bg-white/20"></div>

            <button onClick={togglePiP} className="text-white hover:text-yellow-400 transition transform hover:scale-110" title="Picture-in-Picture">
              <Icons.PiP />
            </button>
            <button onClick={requestCast} className="text-white hover:text-cyan-400 transition transform hover:scale-110" title="AirPlay / Cast">
              <Icons.Cast />
            </button>

            <button onClick={handleScreenshot} className="text-white hover:text-purple-400 transition transform hover:scale-110" title="Take Screenshot">
              <Icons.Camera />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Open Button (Mobile floating toggle & Desktop) */}
      {sidebarCollapsed && (
        <button 
          onClick={() => setSidebarCollapsed(false)}
          className={`absolute z-50 p-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-2xl ui-layer top-6 ${isMobile ? 'left-4' : 'left-6'} active:scale-95`}
        >
          <Icons.Menu />
        </button>
      )}

      {/* Mobile Swipe-to-Close Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm animate-in fade-in" 
          onClick={() => setSidebarCollapsed(true)}
        ></div>
      )}

      {/* 2. FOREGROUND UI LAYER (SIDEBAR) */}
      <div
        className={`glass-panel z-40 relative ui-layer shadow-[20px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ${sidebarCollapsed ? '-translate-x-full absolute' : 'translate-x-0 absolute md:relative'}`}
        style={!isMobile ? { width: `${sidebarWidth}px`, minWidth: '320px' } : { width: '100%' }}
      >
        {!isMobile && (
          <div
            className={`resizer ${isDragging.current ? 'dragging' : ''}`}
            onMouseDown={() => {
              isDragging.current = true;
              document.body.style.cursor = 'col-resize';
            }}
          />
        )}

        {/* Condensed Header */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] shrink-0 flex justify-between items-center bg-black/30 md:bg-transparent">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/15 transition text-white border border-[rgba(255,255,255,0.1)] active:scale-95"
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse Sidebar"
            >
              <Icons.Menu />
            </button>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Icons.TV />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-wide leading-none">StreamOS</h1>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-1 font-semibold tracking-widest uppercase">
                {activeSourceCount > 0 ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                )}
                {activeSourceCount} ACTIVE SOURCES
              </div>
            </div>
          </div>

          <button
            className="p-3 rounded-xl bg-white/5 hover:bg-white/15 transition text-white border border-[rgba(255,255,255,0.1)] active:scale-95"
            onClick={() => setShowSettings(true)}
            title="Settings & Sources"
          >
            <Icons.Settings />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 px-6 border-b border-[rgba(255,255,255,0.03)] space-y-3 shrink-0 bg-black/20 relative z-20">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, category, or country..."
              className="input-minimal w-full pl-10 pr-8 bg-white/5 border-transparent focus:bg-white/10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            {filters.search && (
              <button 
                onClick={() => setFilters({ ...filters, search: '' })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                title="Clear Search"
              >
                <Icons.Close />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex flex-col gap-1.5">
               <label className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider pl-1">Playlist Type</label>
               <SearchableSelect 
                 icon={getIconForType(filters.type)}
                 placeholder="Select Type"
                 options={typeOptions}
                 value={filters.type}
                 onChange={(val: any) => setFilters({...filters, type: val || 'all', value: ''})}
               />
             </div>
             
             <div className={`flex flex-col gap-1.5 transition-opacity duration-300 ${filters.type === 'all' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
               <label className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider pl-1">Filter</label>
               <SearchableSelect 
                 icon={<Icons.Filter />}
                 placeholder={filters.type === 'all' ? "All" : "Select Filter..."}
                 options={filters.type === 'all' ? [{value: '', label: 'All'}] : getOptionsForType()}
                 value={filters.value}
                 onChange={(val: any) => setFilters({...filters, value: val})}
               />
             </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-1 flex justify-between items-center uppercase tracking-wider font-semibold">
            <span>{filteredChannels.length} Streams Indexed</span>
            {loadingState && <div className="loader-spinner w-3 h-3 border-2"></div>}
          </div>
        </div>

        {/* Channel Grid/List */}
        <div className="flex-1 overflow-y-auto p-4 px-6 relative">
          {loadingState && allChannels.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <div className="loader-spinner mb-4"></div>
              Synchronizing Database...
            </div>
          ) : displayedChannels.length === 0 ? (
            <div className="text-center p-8 text-[var(--text-muted)] border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl mt-4 bg-black/30">
              No streams match your criteria, or no sources enabled.
            </div>
          ) : (
            <div className="channel-grid">
              {displayedChannels.map((channel, idx) => {
                const countryDetails = getCountryDetails(channel.countryCode);
                const isFocused = focusedIndex === idx;

                return (
                  <button
                    key={channel.id}
                    id={`channel-${idx}`}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    onClick={() => setActiveChannel(channel)}
                    className={`channel-card p-2.5 flex items-center gap-3 text-left w-full 
                      ${activeChannel?.id === channel.id ? 'active' : ''} 
                      ${isFocused ? 'focused' : ''}`}
                    title={channel.name}
                  >
                    {/* Smart HD Logo / Initial Fallback */}
                    <div className="w-10 h-10 rounded bg-black/60 border border-[rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden shrink-0">
                      {channel.logo ? (
                        <img src={channel.logo} alt="" className="w-full h-full object-contain p-1" onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random&color=fff&size=64&bold=true`;
                        }} />
                      ) : (
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random&color=fff&size=64&bold=true`} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Compact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px] truncate leading-tight mb-1 text-white/90 flex justify-between items-center pr-2">
                        <span className="truncate flex items-center gap-2">
                          {activeChannel?.id === channel.id && playerStatus === 'PLAYING' && (
                            <span className="flex items-end gap-[2px] h-3 w-3 shrink-0">
                              <span className="w-[2px] bg-green-400 animate-[bounce_0.8s_infinite] h-full"></span>
                              <span className="w-[2px] bg-green-400 animate-[bounce_1.2s_infinite] h-2/3"></span>
                              <span className="w-[2px] bg-green-400 animate-[bounce_1s_infinite] h-4/5"></span>
                            </span>
                          )}
                          {channel.name}
                        </span>
                        <button 
                          onClick={(e) => pingHealth(e, channel)}
                          className={`shrink-0 ml-2 rounded flex items-center justify-center transition
                            ${healthCache[channel.id] === 'online' ? 'text-green-400' : 
                              healthCache[channel.id] === 'offline' ? 'text-red-500' : 
                              healthCache[channel.id] === 'checking' ? 'text-yellow-400 animate-pulse' : 
                              'text-white/20 hover:text-white/50'}`}
                          title="Ping Stream Health"
                        >
                          <Icons.Check />
                        </button>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 truncate uppercase tracking-wide">
                        {countryDetails.flagCode ? (
                          <img src={`https://flagcdn.com/w20/${countryDetails.flagCode}.png`} alt={countryDetails.name} className="w-3.5 h-auto inline-block relative -top-[1px] opacity-80" />
                        ) : (
                          <span title={countryDetails.name} className="text-[12px]">{countryDetails.flag}</span>
                        )}
                        <span className="truncate max-w-[80px]">{countryDetails.name}</span>
                        {channel.category && (
                          <>
                            <span className="w-[3px] h-[3px] rounded-full bg-[rgba(255,255,255,0.3)] shrink-0"></span>
                            <span className="truncate">{channel.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {filteredChannels.length > RENDER_LIMIT && (
            <div className="p-4 text-center text-xs text-[var(--text-muted)] border-t border-[rgba(255,255,255,0.05)] mt-4">
              + {filteredChannels.length - RENDER_LIMIT} more streams.<br />Refine your search or filters to see them.
            </div>
          )}
        </div>
      </div>

      {/* 3. SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#101014]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] w-full max-w-2xl rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
            
            <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-white"><Icons.Settings /></div>
                <div>
                  <h2 className="text-xl font-bold tracking-wide">Configuration</h2>
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest mt-0.5">Customize your StreamOS Experience</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 hover:rotate-90 transition-all text-white border border-white/5"
              >
                <Icons.Close />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[rgba(255,255,255,0.05)] bg-[#15151a]/50 px-6 pt-4 gap-6">
              <button 
                onClick={() => setSettingsTab('sources')}
                className={`pb-3 text-sm font-medium transition-all ${settingsTab === 'sources' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Stream Sources
              </button>
              <button 
                onClick={() => setSettingsTab('playback')}
                className={`pb-3 text-sm font-medium transition-all ${settingsTab === 'playback' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Playback & General
              </button>
            </div>

            {/* Scrollable Settings Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-8 bg-[#101014]/50">

              {settingsTab === 'sources' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                       Active Stream Directories <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px]">{sources.length}</span>
                    </h3>
                    <p className="text-xs text-gray-500">Toggle stream providers to include them in your unified list.</p>
                  </div>

                  <div className="space-y-2 bg-black/40 rounded-xl p-2 border border-[rgba(255,255,255,0.03)] overflow-hidden">
                    {sources.map(src => (
                      <div key={src.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors group">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className={`text-sm font-medium truncate transition ${src.active ? 'text-white' : 'text-gray-600'}`}>
                            {src.label} {src.custom && <span className="ml-2 text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded tracking-widest uppercase align-middle">Custom</span>}
                          </div>
                          <div className={`text-[10px] truncate mt-0.5 transition ${src.active ? 'text-gray-400' : 'text-gray-700'}`}>{src.url}</div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {src.custom && (
                            <button onClick={() => deleteSource(src.id)} className="text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition" title="Delete Source">
                              <Icons.Trash />
                            </button>
                          )}
                          <input
                            type="checkbox"
                            className="toggle-switch shadow-inner"
                            checked={src.active}
                            onChange={() => toggleSource(src.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Import Custom M3U</h3>
                    <form onSubmit={addManualSource} className="flex gap-3 items-end">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="e.g. My Premium IPTV"
                          className="input-minimal w-full text-sm py-2.5 bg-black/50 border-white/10"
                          value={newSourceLabel}
                          onChange={e => setNewSourceLabel(e.target.value)}
                        />
                        <input
                          type="url"
                          placeholder="https://.../list.m3u8"
                          className="input-minimal w-full text-sm py-2.5 bg-black/50 border-white/10"
                          value={newSourceUrl}
                          onChange={e => setNewSourceUrl(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="bg-white text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition shadow-lg h-fit">
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {settingsTab === 'playback' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-white uppercase tracking-wider block">Stream Resolution (Bitrate)</label>
                    <div className="relative">
                      <select
                        className="input-minimal w-full appearance-none cursor-pointer bg-black/50 border-white/10 py-3 pl-4 pr-10 hover:border-white/30"
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(Number(e.target.value))}
                        disabled={availableQualities.length <= 1}
                      >
                        {availableQualities.length > 0
                          ? availableQualities.map(q => <option key={q.id} value={q.id}>{q.label}</option>)
                          : <option value="-1">Auto (Adaptive Engine Active)</option>
                        }
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <Icons.ChevronDown />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Force a specific resolution if the stream is buffering on Auto mode.</p>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-white/5">
                    <label className="text-sm font-bold text-white uppercase tracking-wider block">Playback Automation</label>
                    
                    <div className="flex justify-between items-center bg-black/40 rounded-xl p-3 border border-[rgba(255,255,255,0.03)] hover:bg-white/5 transition">
                      <div className="pr-4">
                        <div className="text-sm font-medium text-white">Auto-Play Last Stream</div>
                        <div className="text-[10px] text-gray-500 mt-1">Automatically resume your last watched stream on startup.</div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle-switch shadow-inner shrink-0"
                        checked={autoResume}
                        onChange={() => setAutoResume(!autoResume)}
                      />
                    </div>

                    <div className="flex justify-between items-center bg-black/40 rounded-xl p-3 border border-[rgba(255,255,255,0.03)] hover:bg-white/5 transition">
                      <div className="pr-4">
                        <div className="text-sm font-medium text-white flex items-center gap-2">Data Saver Mode <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest leading-none">Mobile Friendly</span></div>
                        <div className="text-[10px] text-gray-500 mt-1">Force the player to select the lowest available bitrate to save mobile data.</div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle-switch shadow-inner shrink-0"
                        checked={dataSaver}
                        onChange={() => setDataSaver(!dataSaver)}
                      />
                    </div>

                    <div className="flex justify-between items-center bg-black/40 rounded-xl p-3 border border-[rgba(255,255,255,0.03)] hover:bg-white/5 transition">
                      <div className="pr-4">
                        <div className="text-sm font-medium text-white flex items-center gap-2">Dynamic Ambilight Glow <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest leading-none">Desktop Only</span></div>
                        <div className="text-[10px] text-gray-500 mt-1">Extract real-time colors from the video frame to cast a cinematic CSS shadow behind the player. Highly performant.</div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle-switch shadow-inner shrink-0"
                        checked={ambilight}
                        onChange={() => setAmbilight(!ambilight)}
                        disabled={isMobile}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-white/5">
                    <label className="text-sm font-bold text-white uppercase tracking-wider block text-red-400">Danger Zone</label>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex justify-between items-center">
                       <div>
                         <h4 className="text-sm font-medium text-white">Factory Reset</h4>
                         <p className="text-xs text-red-300/70 mt-1">Clear all saved filters, sources, UI states, and history.</p>
                       </div>
                       <button 
                         onClick={() => {
                           ['streamos_sources','streamos_filters','streamos_sidebarWidth','streamos_volume','streamos_isMuted','streamos_activeChannel'].forEach(c => document.cookie = c + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;");
                           window.location.reload();
                         }}
                         className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition"
                       >
                         Nuke Everything
                       </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 flex items-center justify-between bg-black/40 border-t border-white/5 backdrop-blur-xl">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest">STREAM-OS • V4.5 TURBO</p>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}