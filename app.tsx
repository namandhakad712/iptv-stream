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

// Ultra Expanded Default Sources Config
const DEFAULT_SOURCES = [
  { id: 'f_main', label: 'Free-TV (Master Playlist)', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', active: true, custom: false },
  { id: 'f_movies', label: 'Free-TV (Movies)', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist_movies.m3u8', active: true, custom: false },
  { id: 'f_news', label: 'Free-TV (News)', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist_news.m3u8', active: true, custom: false },
  { id: 'f_kids', label: 'Free-TV (Kids)', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist_kids.m3u8', active: true, custom: false },
  { id: 'i_mena', label: 'IPTV-Org (Middle East / Arab)', url: 'https://iptv-org.github.io/iptv/regions/mena.m3u', active: true, custom: false },
  { id: 'i_ir', label: 'IPTV-Org (Iran)', url: 'https://iptv-org.github.io/iptv/countries/ir.m3u', active: true, custom: false },
  { id: 'i_iq', label: 'IPTV-Org (Iraq)', url: 'https://iptv-org.github.io/iptv/countries/iq.m3u', active: true, custom: false },
  { id: 'i_ae', label: 'IPTV-Org (UAE)', url: 'https://iptv-org.github.io/iptv/countries/ae.m3u', active: true, custom: false },
  { id: 'i_ru', label: 'IPTV-Org (Russia)', url: 'https://iptv-org.github.io/iptv/countries/ru.m3u', active: true, custom: false },
  { id: 'i_cn', label: 'IPTV-Org (China)', url: 'https://iptv-org.github.io/iptv/countries/cn.m3u', active: true, custom: false },
  { id: 'i_global', label: 'IPTV-Org (Global/All 30k+)', url: 'https://iptv-org.github.io/iptv/index.m3u', active: true, custom: false },
  { id: 'p_usa', label: 'Pluto TV (USA)', url: 'https://i.mjh.nz/PlutoTV/us.m3u8', active: true, custom: false },
  { id: 'plex_us', label: 'Plex Live TV', url: 'https://i.mjh.nz/Plex/us.m3u8', active: true, custom: false },
  { id: 'roku_us', label: 'Roku Channel', url: 'https://i.mjh.nz/Roku/all.m3u8', active: true, custom: false },
  { id: 's_usa', label: 'Samsung TV Plus', url: 'https://i.mjh.nz/SamsungTVPlus/us.m3u8', active: true, custom: false },
  { id: 'tubi_us', label: 'Tubi TV', url: 'https://i.mjh.nz/Tubi/all.m3u8', active: true, custom: false },
  { id: 'pbs_us', label: 'PBS Network', url: 'https://i.mjh.nz/PBS/all.m3u8', active: true, custom: false }
];

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
  if (!code || typeof code !== 'string') return { flag: '🌐', name: 'Global / Int.' };
  let cleanCode = code.trim().toUpperCase();

  if (cleanCode.length === 2) {
    try {
      // Precise Emoji conversion using Regional Indicator Symbols
      const flag = String.fromCodePoint(cleanCode.charCodeAt(0) + 127397, cleanCode.charCodeAt(1) + 127397);
      const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(cleanCode);
      return { flag, name: name || cleanCode };
    } catch (e) {
      return { flag: '🌐', name: cleanCode };
    }
  }
  // Fallback for non-standard country tags
  return { flag: '📺', name: code.charAt(0).toUpperCase() + code.slice(1).toLowerCase() };
};

// --- COMPONENTS ---

const Icons = {
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
  Radio: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
};

const VideoPlayer = ({ channel, onStatus, setAvailableQualities, currentQuality, videoRef, setIsPlaying }) => {
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

          const levels = data.levels.map((l, idx) => ({
            id: idx,
            label: l.height ? `${l.height}p (${Math.round(l.bitrate / 1000)} kbps)` : `${Math.round(l.bitrate / 1000)} kbps`
          }));
          setAvailableQualities([{ id: -1, label: 'Auto (Adaptive)' }, ...levels]);
        });

        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            onStatus('STREAM UNAVAILABLE');
            hls.destroy();
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
      className="w-full h-full object-cover absolute inset-0 z-0 bg-black"
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

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

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
  const [sources, setSources] = useState(() => {
    const saved = getCookie('streamos_sources');
    if (saved) return saved;
    return DEFAULT_SOURCES;
  });

  const [sourceCache, setSourceCache] = useState<any>({});
  const [loadingState, setLoadingState] = useState(false);
  const [filters, setFilters] = useState(() => getCookie('streamos_filters', { type: 'all', value: '', search: '' }));
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState('STANDBY');

  const [isIdle, setIsIdle] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => getCookie('streamos_sidebarWidth', 480));
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Settings & Tools States
  const [showSettings, setShowSettings] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<any>([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [screenshotMsg, setScreenshotMsg] = useState('');
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // Video Controls State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => getCookie('streamos_volume', 1));
  const [isMuted, setIsMuted] = useState(() => getCookie('streamos_isMuted', false));

  const idleTimer = useRef<any>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);
    return () => { document.head.removeChild(styleSheet); };
  }, []);

  useEffect(() => { setCookie('streamos_sources', sources); }, [sources]);
  useEffect(() => { setCookie('streamos_filters', filters); }, [filters]);
  useEffect(() => { setCookie('streamos_sidebarWidth', sidebarWidth); }, [sidebarWidth]);
  useEffect(() => { setCookie('streamos_volume', volume); }, [volume]);
  useEffect(() => { setCookie('streamos_isMuted', isMuted); }, [isMuted]);

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
              const codeMap: any = { 'USA': 'US', 'UK': 'GB', 'CAN': 'CA', 'AUS': 'AU', 'FRA': 'FR', 'DEU': 'DE', 'ITA': 'IT', 'ESP': 'ES', 'IRN': 'IR', 'IRQ': 'IQ', 'ARE': 'AE', 'RUS': 'RU', 'CHN': 'CN', 'IND': 'IN' };
              const countryCode = codeMap[rawCode] || rawCode;

              const category = categoryMatch ? categoryMatch[1].trim() : '';
              const language = languageMatch ? languageMatch[1].trim() : '';
              const logo = logoMatch ? logoMatch[1].trim() : null;

              currentChan = {
                id: `${source.id}-${i}`,
                sourceId: source.id,
                name,
                countryCode,
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
      .flatMap(s => sourceCache[s.id]);
  }, [sources, sourceCache]);

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

    const processedCountries = Array.from(uniqueCountryCodes)
      .map((code: any) => {
        const details = getCountryDetails(code);
        return { value: code, label: `${details.flag} ${details.name}` };
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label));

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
      <VideoPlayer
        channel={activeChannel}
        onStatus={setPlayerStatus}
        setAvailableQualities={setAvailableQualities}
        currentQuality={selectedQuality}
        videoRef={videoRef}
        setIsPlaying={setIsPlaying}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent pointer-events-none z-0 ui-layer"></div>

      {/* Main Status OSD */}
      {!activeChannel ? (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <Icons.TV />
          <span className="ml-4 text-3xl font-light tracking-wide opacity-50">Select a stream</span>
        </div>
      ) : (
        <div className="absolute top-8 right-8 z-10 flex flex-col items-end pointer-events-none drop-shadow-lg ui-layer">
          <div className="text-3xl font-medium shadow-black drop-shadow-md">{activeChannel.name}</div>
          <div className="text-sm uppercase tracking-widest flex items-center gap-2 mt-1 drop-shadow-md">
            {playerStatus === 'PLAYING' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>}
            <span className={playerStatus === 'STREAM UNAVAILABLE' ? 'text-red-400' : 'text-white/80'}>
              {playerStatus}
            </span>
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

            <div className="w-px h-5 bg-white/20"></div>

            <div className="flex items-center gap-3 group">
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

            <button onClick={handleScreenshot} className="text-white hover:text-purple-400 transition transform hover:scale-110" title="Take Screenshot">
              <Icons.Camera />
            </button>
          </div>
        </div>
      )}

      {/* 2. FOREGROUND UI LAYER (SIDEBAR) */}
      <div
        className="glass-panel z-10 relative ui-layer shadow-[20px_0_40px_rgba(0,0,0,0.5)]"
        style={{ width: `${sidebarWidth}px`, minWidth: '320px' }}
      >
        <div
          className={`resizer ${isDragging.current ? 'dragging' : ''}`}
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />

        {/* Condensed Header */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-4">
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
              className="input-minimal w-full pl-10 bg-white/5 border-transparent focus:bg-white/10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
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
                    {/* Compact Logo */}
                    <div className="w-10 h-10 rounded bg-black/60 border border-[rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden shrink-0">
                      {channel.logo ? (
                        <img src={channel.logo} alt="" className="w-full h-full object-contain p-1" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                      ) : (
                        <span className="text-sm font-bold opacity-40">{channel.name.charAt(0)}</span>
                      )}
                    </div>

                    {/* Compact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px] truncate leading-tight mb-1 text-white/90">
                        {channel.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 truncate uppercase tracking-wide">
                        <span title={countryDetails.name} className="text-[12px]">{countryDetails.flag}</span>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#101014] border border-[rgba(255,255,255,0.1)] w-full max-w-lg rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">

            <div className="p-5 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center bg-[#15151a]">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Icons.Settings /> Configuration
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 transition"
              >
                <Icons.Close />
              </button>
            </div>

            {/* Scrollable Settings Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8">

              {/* Source Management Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Unified Providers</h3>
                  <p className="text-xs text-gray-500">Toggle stream providers to include them in your unified list.</p>
                </div>

                <div className="space-y-2 bg-[#1a1a20] rounded-xl p-3 border border-[rgba(255,255,255,0.05)]">
                  {sources.map(src => (
                    <div key={src.id} className="flex justify-between items-center py-2 px-2 hover:bg-white/5 rounded-lg transition">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-medium text-white truncate">{src.label}</div>
                        <div className="text-[10px] text-gray-500 truncate">{src.url}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {src.custom && (
                          <button onClick={() => deleteSource(src.id)} className="text-gray-500 hover:text-red-400 transition">
                            <Icons.Trash />
                          </button>
                        )}
                        <input
                          type="checkbox"
                          className="toggle-switch"
                          checked={src.active}
                          onChange={() => toggleSource(src.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Source Form */}
                <form onSubmit={addManualSource} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Custom Label"
                      className="input-minimal text-xs py-2 mb-2 bg-[#1a1a20]"
                      value={newSourceLabel}
                      onChange={e => setNewSourceLabel(e.target.value)}
                    />
                    <input
                      type="url"
                      placeholder="M3U Playlist URL..."
                      className="input-minimal text-xs py-2 bg-[#1a1a20]"
                      value={newSourceUrl}
                      onChange={e => setNewSourceUrl(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition h-fit">
                    ADD
                  </button>
                </form>
              </div>

              {/* Bitrate Selector */}
              <div className="space-y-2 pt-6 border-t border-[rgba(255,255,255,0.05)]">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Stream Quality (Bitrate)</label>
                <select
                  className="input-minimal w-full appearance-none cursor-pointer bg-[#1a1a20]"
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(Number(e.target.value))}
                  disabled={availableQualities.length <= 1}
                >
                  {availableQualities.length > 0
                    ? availableQualities.map(q => <option key={q.id} value={q.id}>{q.label}</option>)
                    : <option value="-1">Auto (No alternative levels found)</option>
                  }
                </select>
                <p className="text-xs text-gray-500">Force a specific resolution/bitrate if the broadcast supports it.</p>
              </div>

            </div>

            <div className="p-3 text-center bg-[#15151a] border-t border-[rgba(255,255,255,0.05)]">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">StreamOS Engine v4.0 • Unified Architecture</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}