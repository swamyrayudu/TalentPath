'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  Sun,
  Moon,
  Code,
  Calculator,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  Pen,
  Eraser,
  Undo2,
  Paintbrush,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  useColorTheme,
  colorThemeColors,
} from '@/components/context/ColorThemeContext';

interface Note {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'code' | 'math' | 'ideas';
  createdAt: number;
  updatedAt: number;
}

const CATEGORIES = [
  { key: 'general' as const, label: 'General', icon: FileText, emoji: '📝' },
  { key: 'code' as const, label: 'Code', icon: Code, emoji: '💻' },
  { key: 'math' as const, label: 'Math', icon: Calculator, emoji: '🔢' },
  { key: 'ideas' as const, label: 'Ideas', icon: Lightbulb, emoji: '💡' },
];

const STORAGE_KEY = 'talentpath-notes';
const BOARD_STORAGE_KEY = 'talentpath-board';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load notes", e);
  }
  return [];
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("Failed to save notes", e);
  }
}

// Notes icon SVG — clipboard/note style
function NotesIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
      <polyline points="14,3 14,8 21,8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export default function NotesPad() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'notes' | 'board'>('notes');

  // Jamboard state
  const [boardTool, setBoardTool] = useState<'pen' | 'eraser'>('pen');
  const [boardColor, setBoardColor] = useState('#ffffff');
  const [boardStrokeSize, setBoardStrokeSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boardSize, setBoardSize] = useState<'small' | 'medium'>('small');
  const [boardPage, setBoardPage] = useState(1);
  const TOTAL_PAGES = 4;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardHistory = useRef<ImageData[]>([]);

  // Draggable position
  const [btnPos, setBtnPos] = useState({ x: 16, y: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const floatingBtnRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { colorTheme } = useColorTheme();
  const accent = colorThemeColors[colorTheme];

  // Load notes on mount
  const MIN_Y = 70;
  const [pageDark, setPageDark] = useState(true);

  useEffect(() => {
    setBtnPos({ x: 16, y: Math.max(MIN_Y, Math.round(window.innerHeight / 2 + 40)) });
    setMounted(true);
    setNotes(loadNotes());
    const checkDark = () => setPageDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Persist notes whenever they change
  useEffect(() => {
    if (mounted) saveNotes(notes);
  }, [notes, mounted]);

  // Auto-focus textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing, activeNoteId]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      didDrag.current = true;
      const newX = Math.max(0, Math.min(window.innerWidth - 48, e.clientX - dragOffset.current.x));
      const newY = Math.max(MIN_Y, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
      setBtnPos({ x: newX, y: newY });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleBtnClick = useCallback(() => {
    if (!didDrag.current) {
      setIsOpen((prev) => {
        if (prev) {
          // Closing — clean up empty notes
          setNotes((notes) => notes.filter((n) => n.title.trim() || n.content.trim()));
          setIsEditing(false);
        }
        return !prev;
      });
    }
  }, []);

  // Remove notes that have no title and no content
  const cleanupEmptyNotes = useCallback(() => {
    setNotes((prev) => prev.filter((n) => n.title.trim() || n.content.trim()));
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close when clicking outside if in board view
      if (viewMode === 'board') return;

      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        floatingBtnRef.current &&
        !floatingBtnRef.current.contains(e.target as Node)
      ) {
        cleanupEmptyNotes();
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, viewMode, cleanupEmptyNotes]);

  // Create a new note
  const createNote = (category: 'general' | 'code' | 'math' | 'ideas' = 'general') => {
    const newNote: Note = {
      id: generateId(),
      title: '',
      content: '',
      category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsEditing(true);
    setShowCategoryFilter(false);
  };

  // Update note
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)),
    );
  };

  // Delete note
  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
      setIsEditing(false);
    }
    setDeleteConfirm(null);
  };

  // Filtered notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || n.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryInfo = (key: string) =>
    CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];

  // Theme styles
  const dark = {
    bg: 'bg-[#0f0f13]',
    border: 'border-[#2a2a35]',
    text: 'text-[#e8e8f0]',
    subtext: 'text-[#888]',
    card: 'bg-[#1a1a22]',
    hover: 'hover:bg-[#1e1e2a]',
    input: 'bg-[#15151d]',
  };

  const light = {
    bg: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
    card: 'bg-gray-50',
    hover: 'hover:bg-gray-100',
    input: 'bg-gray-50',
  };

  const theme = isDark ? dark : light;

  // Panel dimensions — dynamic based on board size
  const panelWidth = viewMode === 'board' && boardSize === 'medium' ? 520 : 320;
  const panelHeight = viewMode === 'board' && boardSize === 'medium' ? 600 : 480;
  const getPanelPos = () => {
    const btnCenterY = btnPos.y + 24;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

    let px = btnPos.x + 56;
    if (px + panelWidth > vw - 8) {
      px = btnPos.x - panelWidth - 8;
    }
    if (px < 8) px = 8;

    let py = btnCenterY - panelHeight / 2;
    if (py < 8) py = 8;
    if (py + panelHeight > vh - 8) py = vh - panelHeight - 8;

    return { left: px, top: py };
  };

  // === Jamboard canvas drawing ===
  const getCanvasCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const saveCanvasState = useCallback(() => {
    const ctx = getCanvasCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    boardHistory.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    // Keep max 30 undo steps
    if (boardHistory.current.length > 30) boardHistory.current.shift();
  }, [getCanvasCtx]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = isDark ? '#15151d' : '#f8f8fa';
    ctx.fillRect(0, 0, rect.width, rect.height);
    // Draw subtle grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < rect.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke();
    }
    boardHistory.current = [];
  }, [isDark]);

  // Load a specific page's saved drawing onto the canvas
  const loadPage = useCallback((page: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    try {
      const saved = localStorage.getItem(`${BOARD_STORAGE_KEY}-${page}`);
      if (saved) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = saved;
      }
    } catch (e) {
      console.error("Failed to load page image", e);
    }
  }, []);

  // Init canvas when board view opens, size changes, or page changes
  useEffect(() => {
    if (isOpen && viewMode === 'board') {
      setTimeout(() => {
        initCanvas();
        loadPage(boardPage);
      }, 80);
    }
  }, [isOpen, viewMode, initCanvas, boardSize, boardPage, loadPage]);

  const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getCanvasCtx();
    if (!canvas || !ctx) return;
    saveCanvasState();
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (boardTool === 'eraser') {
      ctx.strokeStyle = isDark ? '#15151d' : '#f8f8fa';
      ctx.lineWidth = boardStrokeSize * 4;
    } else {
      ctx.strokeStyle = boardColor;
      ctx.lineWidth = boardStrokeSize;
    }
  }, [getCanvasCtx, saveCanvasState, boardTool, boardColor, boardStrokeSize, isDark]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getCanvasCtx();
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getCanvasCtx]);

  // Save canvas to localStorage for current page
  const persistCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      localStorage.setItem(`${BOARD_STORAGE_KEY}-${boardPage}`, canvas.toDataURL('image/png'));
    } catch (e) {
      console.error("Failed to persist canvas", e);
    }
  }, [boardPage]);

  const stopDrawing = useCallback(() => {
    const ctx = getCanvasCtx();
    if (ctx) ctx.closePath();
    setIsDrawing(false);
    persistCanvas();
  }, [getCanvasCtx, persistCanvas]);

  const undoCanvas = useCallback(() => {
    const ctx = getCanvasCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || boardHistory.current.length === 0) return;
    const prev = boardHistory.current.pop()!;
    ctx.putImageData(prev, 0, 0);
    persistCanvas();
  }, [getCanvasCtx, persistCanvas]);

  const clearCanvas = useCallback(() => {
    saveCanvasState();
    // Clear saved data for current page
    try { 
      localStorage.removeItem(`${BOARD_STORAGE_KEY}-${boardPage}`); 
    } catch (e) {
      console.error("Failed to remove board page", e);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = isDark ? '#15151d' : '#f8f8fa';
    ctx.fillRect(0, 0, rect.width, rect.height);
    // Redraw grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < rect.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke();
    }
    boardHistory.current = [];
  }, [saveCanvasState, isDark, boardPage]);

  // Switch page: save current, then switch
  const switchPage = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > TOTAL_PAGES || newPage === boardPage) return;
    persistCanvas();
    setBoardPage(newPage);
  }, [boardPage, persistCanvas, TOTAL_PAGES]);

  const BOARD_COLORS = [
    '#ffffff', '#ff4444', '#ff9800', '#ffeb3b',
    '#4caf50', '#2196f3', '#9c27b0', '#e91e63',
  ];

  if (!mounted) return null;

  const noteCount = notes.length;

  return (
    <>
      {/* Draggable Floating Button */}
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
            backgroundColor:
              noteCount > 0
                ? `${accent}30`
                : pageDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
            borderColor:
              noteCount > 0
                ? `${accent}50`
                : pageDark
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.12)',
          }}
        >
          {noteCount > 0 ? (
            <div className="relative flex items-center justify-center w-full h-full">
              <NotesIcon className="w-5 h-5 relative z-10" style={{ color: accent }} />
              {/* Note count badge */}
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white z-20"
                style={{ backgroundColor: accent }}
              >
                {noteCount > 9 ? '9+' : noteCount}
              </span>
            </div>
          ) : (
            <NotesIcon
              className="w-5 h-5"
              style={{ color: pageDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' }}
            />
          )}
        </div>
      </div>

      {/* Notes Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{ left: getPanelPos().left, top: getPanelPos().top, maxHeight: panelHeight }}
          className={`fixed z-50 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-sm ${theme.bg} ${theme.border}`}
          id="notes-pad-panel"
        >
          {/* ===== EDITING VIEW ===== */}
          {isEditing && activeNote ? (
            <div className="flex flex-col" style={{ width: panelWidth, height: panelHeight }}>
              {/* Editor Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
                <button
                  onClick={() => {
                    cleanupEmptyNotes();
                    setIsEditing(false);
                    setActiveNoteId(null);
                  }}
                  className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${theme.subtext} ${theme.hover}`}
                >
                  ← Back
                </button>
                <div className="flex items-center gap-1">
                  {/* Category selector */}
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => updateNote(activeNote.id, { category: cat.key })}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] transition-all ${
                        activeNote.category === cat.key
                          ? ''
                          : isDark
                          ? 'opacity-40 hover:opacity-70'
                          : 'opacity-40 hover:opacity-70'
                      }`}
                      style={
                        activeNote.category === cat.key
                          ? { backgroundColor: `${accent}22`, outline: `1px solid ${accent}` }
                          : {}
                      }
                      title={cat.label}
                    >
                      {cat.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="px-3 pb-1 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Note title..."
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  className={`w-full text-sm font-semibold bg-transparent border-none outline-none placeholder-gray-500 ${theme.text}`}
                />
              </div>

              {/* Divider */}
              <div className={`mx-3 border-b ${theme.border} flex-shrink-0`} />

              {/* Content textarea */}
              <div className="flex-1 px-3 pt-2 pb-3 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  placeholder={
                    activeNote.category === 'code'
                      ? '// Write your code snippet...\nfunction solve() {\n  \n}'
                      : activeNote.category === 'math'
                      ? '// Calculations & formulas\n2^10 = 1024\nO(n log n)\n'
                      : activeNote.category === 'ideas'
                      ? '💡 Your brilliant idea...\n\n- Key points\n- Implementation notes'
                      : 'Start typing your note...'
                  }
                  value={activeNote.content}
                  onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                  className={`w-full h-full resize-none bg-transparent border-none outline-none text-xs leading-relaxed placeholder-gray-500 ${theme.text} ${
                    activeNote.category === 'code' || activeNote.category === 'math'
                      ? 'font-mono'
                      : ''
                  }`}
                  style={{ minHeight: '100%' }}
                  spellCheck={activeNote.category !== 'code'}
                />
              </div>

              {/* Footer */}
              <div
                className={`px-3 py-2 flex items-center justify-between border-t ${theme.border} flex-shrink-0`}
              >
                <span className={`text-[10px] ${theme.subtext}`}>
                  {activeNote.content.length} chars · Updated {formatDate(activeNote.updatedAt)}
                </span>
                <button
                  onClick={() => {
                    cleanupEmptyNotes();
                    setIsEditing(false);
                    setActiveNoteId(null);
                  }}
                  className="text-[10px] font-medium px-2 py-1 rounded-md text-white transition-colors"
                  style={{ backgroundColor: accent }}
                >
                  <Check className="w-3 h-3 inline mr-0.5" />
                  Done
                </button>
              </div>

              {/* Accent bar */}
              <div
                className="h-1 w-full transition-colors duration-300 flex-shrink-0"
                style={{ backgroundColor: accent }}
              />
            </div>
          ) : viewMode === 'board' ? (
            /* ===== JAMBOARD VIEW ===== */
            <div className="flex flex-col" style={{ width: panelWidth, height: panelHeight }}>
              {/* Board Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-lg p-1.5 flex items-center justify-center"
                    style={{ backgroundColor: accent }}
                  >
                    <Paintbrush className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${theme.text}`}>Board</span>
                  <span className={`text-[9px] ${theme.subtext}`}>temp</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Switch to Notes */}
                  <button
                    onClick={() => setViewMode('notes')}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                    title="Switch to Notes"
                  >
                    <StickyNote className="w-4 h-4" />
                  </button>
                  {/* Resize toggle */}
                  <button
                    onClick={() => setBoardSize((s) => s === 'small' ? 'medium' : 'small')}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                    title={boardSize === 'small' ? 'Expand board' : 'Shrink board'}
                  >
                    {boardSize === 'small' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  {/* Dark/Light */}
                  <button
                    onClick={() => { setIsDark(!isDark); setTimeout(initCanvas, 100); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  {/* Close */}
                  <button
                    onClick={() => { cleanupEmptyNotes(); setIsOpen(false); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawing tools bar */}
              <div className={`px-3 pb-2 flex items-center gap-1.5 flex-shrink-0 flex-wrap`}>
                {/* Pen */}
                <button
                  onClick={() => setBoardTool('pen')}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    boardTool === 'pen' ? 'text-white' : `${theme.subtext}`
                  }`}
                  style={boardTool === 'pen' ? { backgroundColor: accent } : {}}
                  title="Pen"
                >
                  <Pen className="w-3.5 h-3.5" />
                </button>
                {/* Eraser */}
                <button
                  onClick={() => setBoardTool('eraser')}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    boardTool === 'eraser' ? 'text-white' : `${theme.subtext}`
                  }`}
                  style={boardTool === 'eraser' ? { backgroundColor: accent } : {}}
                  title="Eraser"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>

                {/* Divider */}
                <div className={`w-px h-5 mx-0.5 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                {/* Colors */}
                {BOARD_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setBoardColor(c); setBoardTool('pen'); }}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-125 flex-shrink-0"
                    style={{
                      backgroundColor: c,
                      outline: boardColor === c && boardTool === 'pen' ? `2px solid ${accent}` : '1px solid rgba(128,128,128,0.3)',
                      outlineOffset: boardColor === c && boardTool === 'pen' ? '1px' : '0px',
                    }}
                    title={c}
                  />
                ))}

                {/* Divider */}
                <div className={`w-px h-5 mx-0.5 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                {/* Stroke size */}
                <select
                  value={boardStrokeSize}
                  onChange={(e) => setBoardStrokeSize(Number(e.target.value))}
                  className={`text-[10px] rounded-md px-1 py-0.5 border outline-none ${theme.border} ${theme.input} ${theme.text}`}
                  style={{ width: 40 }}
                >
                  <option value={1}>1px</option>
                  <option value={2}>2px</option>
                  <option value={3}>3px</option>
                  <option value={5}>5px</option>
                  <option value={8}>8px</option>
                </select>

                {/* Undo */}
                <button
                  onClick={undoCanvas}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                  title="Undo"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                {/* Clear */}
                <button
                  onClick={clearCanvas}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                  title="Clear board"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Canvas */}
              <div className="flex-1 mx-3 mb-3 rounded-xl overflow-hidden border" style={{ borderColor: isDark ? '#2a2a35' : '#e5e7eb' }}>
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  className="w-full h-full cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </div>

              {/* Page navigation */}
              <div className="flex items-center justify-center gap-2 px-3 pb-2 flex-shrink-0">
                <button
                  onClick={() => switchPage(boardPage - 1)}
                  disabled={boardPage === 1}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${boardPage === 1 ? 'opacity-30 cursor-not-allowed' : `${theme.subtext} ${theme.hover}`}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => switchPage(p)}
                    className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                      boardPage === p ? 'text-white scale-110' : `${theme.subtext} ${isDark ? 'bg-white/5' : 'bg-black/5'} hover:scale-105`
                    }`}
                    style={boardPage === p ? { backgroundColor: accent } : {}}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => switchPage(boardPage + 1)}
                  disabled={boardPage === TOTAL_PAGES}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${boardPage === TOTAL_PAGES ? 'opacity-30 cursor-not-allowed' : `${theme.subtext} ${theme.hover}`}`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Accent bar */}
              <div
                className="h-1 w-full transition-colors duration-300 flex-shrink-0"
                style={{ backgroundColor: accent }}
              />
            </div>
          ) : (
            /* ===== LIST VIEW ===== */
            <div className="flex flex-col" style={{ width: panelWidth, maxHeight: panelHeight }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-lg p-1.5 flex items-center justify-center"
                    style={{ backgroundColor: accent }}
                  >
                    <StickyNote className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${theme.text}`}>Notes</span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${accent}22`, color: accent }}
                  >
                    {notes.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Board toggle — highlighted */}
                  <button
                    onClick={() => setViewMode('board')}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      backgroundColor: `${accent}22`,
                      color: accent,
                      border: `1px solid ${accent}44`,
                    }}
                    title="Open Scratch Board"
                  >
                    <Paintbrush className="w-4 h-4" />
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
                    onClick={() => { cleanupEmptyNotes(); setIsOpen(false); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${theme.subtext} ${theme.hover}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search bar */}
              <div className="px-3 pb-2 flex-shrink-0">
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${theme.border} ${theme.input}`}
                >
                  <Search className={`w-3.5 h-3.5 flex-shrink-0 ${theme.subtext}`} />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`flex-1 text-xs bg-transparent border-none outline-none placeholder-gray-500 ${theme.text}`}
                  />
                </div>
              </div>

              {/* Category filter chips */}
              <div className="px-3 pb-2 flex items-center gap-1.5 flex-wrap flex-shrink-0">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`text-[10px] font-medium px-2 py-1 rounded-full transition-all ${
                    !filterCategory
                      ? 'text-white'
                      : `${theme.subtext} ${isDark ? 'bg-white/5' : 'bg-black/5'}`
                  }`}
                  style={!filterCategory ? { backgroundColor: accent } : {}}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() =>
                      setFilterCategory(filterCategory === cat.key ? null : cat.key)
                    }
                    className={`text-[10px] font-medium px-2 py-1 rounded-full transition-all flex items-center gap-1 ${
                      filterCategory === cat.key
                        ? 'text-white'
                        : `${theme.subtext} ${isDark ? 'bg-white/5' : 'bg-black/5'}`
                    }`}
                    style={filterCategory === cat.key ? { backgroundColor: accent } : {}}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* New Note button */}
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Note
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Category dropdown */}
                  {showCategoryFilter && (
                    <div
                      className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg overflow-hidden z-10 ${theme.bg} ${theme.border}`}
                    >
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => createNote(cat.key)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${theme.text} ${theme.hover}`}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.label} Note</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes list */}
              <div
                className="flex-1 overflow-y-auto px-3 pb-3"
                style={{ scrollbarWidth: 'thin' }}
              >
                {filteredNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <NotesIcon
                      className="w-10 h-10 mb-3"
                      style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                    />
                    <p className={`text-xs ${theme.subtext} text-center`}>
                      {searchQuery
                        ? 'No notes match your search'
                        : 'No notes yet.\nTap "+ New Note" to start!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredNotes.map((note) => {
                      const catInfo = getCategoryInfo(note.category);
                      return (
                        <div
                          key={note.id}
                          className={`group relative rounded-xl border p-2.5 cursor-pointer transition-all duration-200 ${theme.border} ${theme.hover}`}
                          style={
                            activeNoteId === note.id
                              ? { borderColor: accent, backgroundColor: `${accent}08` }
                              : {}
                          }
                          onClick={() => {
                            setActiveNoteId(note.id);
                            setIsEditing(true);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            {/* Category emoji */}
                            <span className="text-sm flex-shrink-0 mt-0.5">{catInfo.emoji}</span>

                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <p
                                className={`text-xs font-semibold truncate ${theme.text} ${
                                  !note.title ? 'italic opacity-50' : ''
                                }`}
                              >
                                {note.title || 'Untitled note'}
                              </p>
                              {/* Preview */}
                              <p
                                className={`text-[11px] mt-0.5 truncate ${theme.subtext}`}
                              >
                                {note.content.slice(0, 60) || 'Empty note'}
                              </p>
                              {/* Meta */}
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${accent}15`,
                                    color: accent,
                                  }}
                                >
                                  {catInfo.label}
                                </span>
                                <span className={`text-[9px] ${theme.subtext}`}>
                                  {formatDate(note.updatedAt)}
                                </span>
                              </div>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deleteConfirm === note.id) {
                                  deleteNote(note.id);
                                } else {
                                  setDeleteConfirm(note.id);
                                  setTimeout(() => setDeleteConfirm(null), 3000);
                                }
                              }}
                              className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all ${
                                deleteConfirm === note.id
                                  ? 'bg-red-500/20 text-red-400'
                                  : `${theme.subtext} ${theme.hover}`
                              }`}
                              title={
                                deleteConfirm === note.id ? 'Click again to confirm' : 'Delete note'
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accent bar */}
              <div
                className="h-1 w-full transition-colors duration-300 flex-shrink-0"
                style={{ backgroundColor: accent }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
