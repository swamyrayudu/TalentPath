'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Music, X, SkipBack, SkipForward, Sun, Moon, Palette, ChevronDown } from 'lucide-react';
import {
  useColorTheme,
  colorThemeLabels,
  colorThemeColors,
  type ColorTheme,
} from '@/components/context/ColorThemeContext';

interface Song {
  id: number;
  title: string;
  artist: string;
  url: string;
  note: string;
}

const SONGS: Song[] = [
  {
    id: 1,
    title: "Chubina",
    artist: "East Duo",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    note: "🎵"
  },
  {
    id: 2,
    title: "Hukum (Thalaivar Alappara)",
    artist: "Anirudh Ravichander",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    note: "🔥"
  },
  {
    id: 3,
    title: "Badass (Leo BGM)",
    artist: "Anirudh Ravichander",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    note: "🦁"
  },
  {
    id: 4,
    title: "Vikram Title Track",
    artist: "Anirudh Ravichander",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    note: "🕶️"
  },
  {
    id: 5,
    title: "Ordinary Person",
    artist: "Anirudh Ravichander",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    note: "❄️"
  },
];

const colorThemes: ColorTheme[] = ['yellow', 'blue', 'red', 'green', 'purple', 'orange', 'pink', 'cyan'];

// Spotify-style SVG icon
function SpotifyIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isDark, setIsDark] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Draggable position — use fixed default for SSR, update on mount
  const [btnPos, setBtnPos] = useState({ x: 16, y: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const floatingBtnRef = useRef<HTMLDivElement>(null);

  // Use the project-wide color theme
  const { colorTheme, setColorTheme } = useColorTheme();
  const accent = colorThemeColors[colorTheme];

  const currentSong = SONGS[currentSongIndex];

  // Initialize position on mount (SSR safe) & detect page theme
  const MIN_Y = 70; // Below the navbar
  const [pageDark, setPageDark] = useState(true);
  useEffect(() => {
    setBtnPos({ x: 16, y: Math.max(MIN_Y, Math.round(window.innerHeight / 2 - 24)) });
    setMounted(true);
    // Detect page dark/light mode
    const checkDark = () => setPageDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Dragging handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    didDrag.current = false;
    const rect = floatingBtnRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    didDrag.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 48, e.clientX - dragOffset.current.x));
    const newY = Math.max(MIN_Y, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
    setBtnPos({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleBtnClick = useCallback(() => {
    // Only toggle if we didn't drag
    if (!didDrag.current) {
      setIsOpen((prev) => !prev);
    }
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        floatingBtnRef.current && !floatingBtnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentSong.url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentSongIndex]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNextSong = () => {
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
    setIsPlaying(true);
  };

  const playPrevSong = () => {
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (isPlaying) audioRef.current.play();
    }
  };

  const handleEnded = () => {
    playNextSong();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const progressStyle = {
    background: `linear-gradient(to right, ${accent} ${progressPercent}%, ${isDark ? '#2a2a35' : '#e5e7eb'} ${progressPercent}%)`,
  };

  const volumeStyle = {
    background: `linear-gradient(to right, ${accent} ${volume}%, ${isDark ? '#2a2a35' : '#e5e7eb'} ${volume}%)`,
  };

  const dark = {
    bg: 'bg-[#0f0f13]',
    border: 'border-[#2a2a35]',
    text: 'text-[#e8e8f0]',
    subtext: 'text-[#888]',
    card: 'bg-[#1a1a22]',
    hover: 'hover:bg-[#1e1e2a]',
  };

  const light = {
    bg: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
    card: 'bg-gray-100',
    hover: 'hover:bg-gray-100',
  };

  const theme = isDark ? dark : light;

  // Calculate panel position relative to button
  const panelWidth = 288; // w-72 = 18rem = 288px
  const panelHeight = 520;
  const getPanelPos = () => {
    const btnCenterY = btnPos.y + 24;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

    // Prefer placing panel to the right of button, or left if no space
    let px = btnPos.x + 56;
    if (px + panelWidth > vw - 8) {
      px = btnPos.x - panelWidth - 8;
    }
    if (px < 8) px = 8;

    // Vertically center on button, clamp to viewport
    let py = btnCenterY - panelHeight / 2;
    if (py < 8) py = 8;
    if (py + panelHeight > vh - 8) py = vh - panelHeight - 8;

    return { left: px, top: py };
  };

  // Don't render until client-side mounted to avoid SSR hydration mismatch
  if (!mounted) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Draggable Floating Button — Spotify style, transparent glass */}
      <div
        ref={floatingBtnRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleBtnClick}
        style={{
          left: btnPos.x,
          top: btnPos.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        className="fixed z-40 select-none"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          style={{
            backgroundColor: isPlaying
              ? `${accent}30`
              : pageDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
            borderColor: isPlaying
              ? `${accent}50`
              : pageDark
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(0,0,0,0.12)',
          }}
        >
          {isPlaying ? (
            <div className="relative flex items-center justify-center w-full h-full">
              <div
                className="absolute w-full h-full rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: `${accent}cc`, borderRightColor: `${accent}44` }}
              />
              <SpotifyIcon className="w-6 h-6 relative z-10" style={{ color: accent }} />
            </div>
          ) : (
            <SpotifyIcon className="w-6 h-6" style={{ color: pageDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' }} />
          )}
        </div>
      </div>

      {/* Player Panel — positioned relative to button */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{ left: getPanelPos().left, top: getPanelPos().top }}
          className={`fixed z-50 w-72 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-sm ${theme.bg} ${theme.border}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div
                className="rounded-lg p-1.5 flex items-center justify-center"
                style={{ backgroundColor: accent }}
              >
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-medium ${theme.text}`}>Music</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Color Picker Toggle */}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${theme.subtext} ${theme.hover}`}
                style={showColorPicker ? { color: accent, outline: `1px solid ${accent}`, outlineOffset: '-1px' } : {}}
                title="Change project color theme"
              >
                <Palette className="w-4 h-4" />
              </button>

              {/* Dark/Light Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Picker Panel (expandable) */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: showColorPicker ? '160px' : '0px',
              opacity: showColorPicker ? 1 : 0,
            }}
          >
            <div className="px-4 pb-3">
              {/* Label */}
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${theme.subtext}`}>
                  Project Theme
                </span>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className={`${theme.subtext} transition-colors`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Color Grid */}
              <div className="grid grid-cols-4 gap-2">
                {colorThemes.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setColorTheme(ct)}
                    className={`group relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                      colorTheme === ct
                        ? isDark
                          ? 'bg-white/10'
                          : 'bg-black/5'
                        : isDark
                        ? 'hover:bg-white/5'
                        : 'hover:bg-black/5'
                    }`}
                    style={colorTheme === ct ? { outline: `1px solid ${colorThemeColors[ct]}`, outlineOffset: '-1px' } : {}}
                    title={colorThemeLabels[ct]}
                  >
                    {/* Color Circle */}
                    <div className="relative">
                      <div
                        className="w-7 h-7 rounded-full transition-transform duration-200 group-hover:scale-110"
                        style={{
                          backgroundColor: colorThemeColors[ct],
                          boxShadow: colorTheme === ct
                            ? `0 0 10px ${colorThemeColors[ct]}66`
                            : 'none',
                        }}
                      />
                      {colorTheme === ct && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold drop-shadow-sm">
                          ✓
                        </span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-[9px] font-medium leading-tight ${
                        colorTheme === ct ? theme.text : theme.subtext
                      }`}
                    >
                      {colorThemeLabels[ct]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Album Art */}
          <div className="mx-4 mb-3">
            <div
              className="h-36 rounded-xl flex items-center justify-center text-5xl"
              style={{ backgroundColor: `${accent}22` }}
            >
              {currentSong.note}
            </div>
          </div>

          {/* Song Info */}
          <div className="px-4 mb-3">
            <p className={`text-sm font-semibold truncate ${theme.text}`}>{currentSong.title}</p>
            <p className={`text-xs mt-0.5 truncate ${theme.subtext}`}>{currentSong.artist}</p>
          </div>

          {/* Progress */}
          <div className="px-4 mb-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              step="0.1"
              onChange={handleSeek}
              style={progressStyle}
              className="w-full h-1 rounded-full appearance-none cursor-pointer outline-none border-none"
            />
            <div className="flex justify-between mt-1">
              <span className={`text-[10px] ${theme.subtext}`}>{formatTime(currentTime)}</span>
              <span className={`text-[10px] ${theme.subtext}`}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 px-4 mb-3">
            <button
              onClick={playPrevSong}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              style={{ backgroundColor: accent }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={playNextSong}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <Volume2 className={`w-4 h-4 flex-shrink-0 ${theme.subtext}`} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              step="1"
              onChange={handleVolumeChange}
              style={volumeStyle}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer outline-none border-none"
            />
            <span className={`text-[10px] min-w-[28px] text-right ${theme.subtext}`}>{volume}%</span>
          </div>

          {/* Active Theme Indicator Bar */}
          <div
            className="h-1 w-full transition-colors duration-300"
            style={{ backgroundColor: accent }}
          />
        </div>
      )}

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${accent};
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${accent};
          border: none;
          cursor: pointer;
        }
      `}
      </style>
    </>
  );
}