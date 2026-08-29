'use client';
import React from 'react';
import { memo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Loader2,
  Lightbulb,
  LightbulbOff,
  Braces,
  Maximize2,
  Minimize2,
  RotateCcw,
  Minus,
  Plus,
  Lock,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { useCodeEditor, DEFAULT_CODE } from './useCodeEditor';
import { useColorTheme, colorThemeColors, ColorTheme } from '@/components/context/ColorThemeContext';
import { useSession, signIn } from 'next-auth/react';
import type * as Monaco from 'monaco-editor';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

// Tint string literals with the active accent colour, on top of Monaco's base theme.
const defineCustomTheme = (monaco: typeof Monaco, colorTheme: ColorTheme, isDark: boolean) => {
  const stringColor = colorThemeColors[colorTheme].replace('#', '');
  const themeName = isDark ? 'custom-dark' : 'custom-light';

  monaco.editor.defineTheme(themeName, {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'string', foreground: stringColor },
      { token: 'string.escape', foreground: stringColor },
      { token: 'string.quoted', foreground: stringColor },
      { token: 'string.quoted.double', foreground: stringColor },
      { token: 'string.quoted.single', foreground: stringColor },
    ],
    colors: {},
  });

  return themeName;
};

const FILENAMES: Record<string, string> = {
  python: 'main.py',
  javascript: 'main.js',
  java: 'Main.java',
  cpp: 'main.cpp',
  c: 'main.c',
  go: 'main.go',
};

const EDITOR_FONT = { min: 11, max: 24, step: 1 };
const TERMINAL_FONT = { min: 10, max: 20, step: 1 };

/* ── Small shared pieces ────────────────────────────────────────── */

const TrafficLights = memo(() => (
  <div aria-hidden className="flex items-center gap-1.5">
    <span className="size-3 rounded-full bg-[#ff5f57]" />
    <span className="size-3 rounded-full bg-[#febc2e]" />
    <span className="size-3 rounded-full bg-[#28c840]" />
  </div>
));
TrafficLights.displayName = 'TrafficLights';

const IconButton = memo(
  ({
    onClick,
    title,
    active,
    disabled,
    children,
  }: {
    onClick?: () => void;
    title: string;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';

const FontSizeControl = memo(
  ({
    value,
    onChange,
    bounds,
    label,
  }: {
    value: number;
    onChange: (n: number) => void;
    bounds: { min: number; max: number; step: number };
    label: string;
  }) => (
    <div className="flex items-center rounded-md border">
      <button
        onClick={() => onChange(Math.max(bounds.min, value - bounds.step))}
        disabled={value <= bounds.min}
        title={`Decrease ${label} font size`}
        aria-label={`Decrease ${label} font size`}
        className="flex size-6 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <Minus className="size-3" />
      </button>
      <span className="w-7 text-center text-xs tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(bounds.max, value + bounds.step))}
        disabled={value >= bounds.max}
        title={`Increase ${label} font size`}
        aria-label={`Increase ${label} font size`}
        className="flex size-6 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <Plus className="size-3" />
      </button>
    </div>
  )
);
FontSizeControl.displayName = 'FontSizeControl';

/* ── Terminal ───────────────────────────────────────────────────── */

const TerminalConsole = memo(
  ({
    terminalOutput,
    terminalInput,
    waitingForInput,
    onInputChange,
    onInputSubmit,
    isRunning,
    fontSize,
  }: {
    terminalOutput: string[];
    terminalInput: string;
    waitingForInput: boolean;
    onInputChange: (value: string) => void;
    onInputSubmit: () => void;
    isRunning: boolean;
    fontSize: number;
  }) => {
    const terminalRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
      if (waitingForInput && inputRef.current) {
        inputRef.current.focus();
      }
    }, [terminalOutput, waitingForInput]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && terminalInput.trim()) {
        e.preventDefault();
        onInputSubmit();
      }
    };

    const lineClass = (line: string) => {
      if (line.includes('❌') || line.includes('Failed') || line.includes('Error')) {
        return 'text-red-400';
      }
      if (line.includes('✅')) return 'text-emerald-400';
      if (line.includes('⚠️')) return 'text-amber-400';
      if (line.startsWith('$') || line.includes('━━━')) return 'text-cyan-400';
      return 'text-zinc-200';
    };

    return (
      <div
        ref={terminalRef}
        className="h-full w-full overflow-y-auto bg-[#0b0b0d] px-4 py-3 font-mono"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
      >
        {terminalOutput.length === 0 ? (
          <p className="m-0">
            <span className="text-emerald-400">$</span>{' '}
            <span className="text-zinc-400">Ready to execute code. Press Run to start.</span>
          </p>
        ) : (
          terminalOutput.map((line, idx) => {
            if (line.includes('👑') && line.includes('/premium')) {
              return (
                <div key={idx} className="my-3">
                  <Link
                    href="/premium"
                    className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                  >
                    <Crown className="size-4" />
                    Upgrade to Premium for unlimited runs
                  </Link>
                </div>
              );
            }
            if (line.includes('Visit: /premium')) return null;
            return (
              <pre key={idx} className={`m-0 whitespace-pre-wrap p-0 ${lineClass(line)}`}>
                {line}
              </pre>
            );
          })
        )}

        {waitingForInput && (
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">$</span>
            <input
              ref={inputRef}
              type="text"
              value={terminalInput}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none bg-transparent font-mono text-emerald-300 caret-emerald-400 outline-none"
              style={{ fontSize: `${fontSize}px` }}
              autoFocus
              disabled={isRunning}
            />
          </div>
        )}

        {isRunning && !waitingForInput && (
          <div className="mt-2 flex items-center gap-2 text-amber-400">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Running…</span>
          </div>
        )}
      </div>
    );
  }
);
TerminalConsole.displayName = 'TerminalConsole';

/* ── Workspace ──────────────────────────────────────────────────── */

export function CodeEditor() {
  const { resolvedTheme } = useTheme();
  const { colorTheme } = useColorTheme();
  const { data: session, status } = useSession();

  const [mounted, setMounted] = React.useState(false);
  const [editorWidth, setEditorWidth] = React.useState(55);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [editorFontSize, setEditorFontSize] = React.useState(14);
  const [terminalFontSize, setTerminalFontSize] = React.useState(13);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [mobilePane, setMobilePane] = React.useState<'editor' | 'terminal'>('editor');

  const containerRef = React.useRef<HTMLDivElement>(null);
  const monacoRef = React.useRef<typeof Monaco | null>(null);
  // Desktop and mobile each mount their own Editor, so keep every instance:
  // a single ref would be overwritten by whichever mounted last (the hidden one).
  const editorsRef = React.useRef<Monaco.editor.IStandaloneCodeEditor[]>([]);
  const [currentTheme, setCurrentTheme] = React.useState<string>('vs-dark');

  const isSessionLoading = status === 'loading';
  const isLoggedIn = status === 'authenticated' && !!session;

  const handleLoginClick = useCallback(() => {
    setIsRedirecting(true);
    signIn('google', { callbackUrl: window.location.href });
  }, []);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  React.useEffect(() => {
    if (mounted && monacoRef.current) {
      const themeName = defineCustomTheme(monacoRef.current, colorTheme, isDark);
      setCurrentTheme(themeName);
      monacoRef.current.editor.setTheme(themeName);
    }
  }, [colorTheme, isDark, mounted]);

  const {
    language,
    code,
    isRunning,
    suggestionsEnabled,
    snippetsEnabled,
    activeTab,
    currentLang,
    terminalOutput,
    terminalInput,
    waitingForInput,
    handleLanguageChange,
    handleCodeChange,
    toggleSuggestions,
    toggleSnippets,
    handleRunClick,
    handleEditorDidMount,
    handleTerminalInputSubmit,
    setTerminalInput,
    editorOptions,
    mobileEditorOptions,
    LANGUAGES,
  } = useCodeEditor();

  // A run switches the hook's tab to output; mirror that on mobile.
  React.useEffect(() => {
    setMobilePane(activeTab === 'output' ? 'terminal' : 'editor');
  }, [activeTab]);

  const handleEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      monacoRef.current = monaco;
      if (!editorsRef.current.includes(editor)) editorsRef.current.push(editor);
      const themeName = defineCustomTheme(monaco, colorTheme, isDark);
      setCurrentTheme(themeName);
      monaco.editor.setTheme(themeName);
      handleEditorDidMount(editor, monaco);
    },
    [handleEditorDidMount, colorTheme, isDark]
  );

  // Write straight to the Monaco model rather than through React state: if the
  // state already equals the starter code, React bails on the re-render and the
  // editor would keep showing stale text. setValue fires onChange, which syncs
  // React state back the normal way.
  const handleResetCode = useCallback(() => {
    const starter = DEFAULT_CODE[language] ?? '';
    const editors = editorsRef.current;
    if (editors.length > 0) {
      editors.forEach(editor => {
        if (editor.getValue() !== starter) editor.setValue(starter);
      });
    } else {
      handleLanguageChange(language);
    }
  }, [language, handleLanguageChange]);

  const handleMouseDown = useCallback(() => setIsResizing(true), []);
  const handleMouseUp = useCallback(() => setIsResizing(false), []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = ((e.clientX - rect.left) / rect.width) * 100;
      if (next >= 25 && next <= 75) setEditorWidth(next);
    },
    [isResizing]
  );

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const mergedEditorOptions = React.useMemo(
    () => ({
      ...editorOptions,
      fontSize: editorFontSize,
      guides: { indentation: true, bracketPairs: false },
    }),
    [editorOptions, editorFontSize]
  );

  const mergedMobileOptions = React.useMemo(
    () => ({
      ...mobileEditorOptions,
      fontSize: editorFontSize,
      guides: { indentation: true, bracketPairs: false },
    }),
    [mobileEditorOptions, editorFontSize]
  );

  const filename = FILENAMES[language] || 'main.txt';

  const runButton = (() => {
    const base =
      'flex h-8 items-center gap-1.5 rounded-md px-3.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 bg-emerald-600 hover:bg-emerald-500';

    if (isSessionLoading) {
      return (
        <button disabled className={base}>
          <Loader2 className="size-3.5 animate-spin" />
          Run
        </button>
      );
    }
    if (isLoggedIn) {
      return (
        <button onClick={handleRunClick} disabled={isRunning} title="Run code" className={base}>
          {isRunning ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Running
            </>
          ) : (
            <>
              <Play className="size-3.5" fill="currentColor" />
              Run
            </>
          )}
        </button>
      );
    }
    return (
      <button
        onClick={handleLoginClick}
        disabled={isRedirecting}
        title="Sign in to run code"
        className={base}
      >
        {isRedirecting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Lock className="size-3.5" />
        )}
        Run
      </button>
    );
  })();

  const editorToolbar = (
    <div className="flex items-center gap-1.5">
      <IconButton
        onClick={toggleSuggestions}
        title={suggestionsEnabled ? 'Disable IntelliSense' : 'Enable IntelliSense'}
        active={suggestionsEnabled}
      >
        {suggestionsEnabled ? (
          <Lightbulb className="size-4" />
        ) : (
          <LightbulbOff className="size-4" />
        )}
      </IconButton>

      <IconButton
        onClick={toggleSnippets}
        title={snippetsEnabled ? 'Disable snippets' : 'Enable snippets'}
        active={snippetsEnabled}
      >
        <Braces className="size-4" />
      </IconButton>

      <IconButton
        onClick={() => setIsMaximized(v => !v)}
        title={isMaximized ? 'Restore split view' : 'Maximize editor'}
      >
        {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      </IconButton>

      <FontSizeControl
        value={editorFontSize}
        onChange={setEditorFontSize}
        bounds={EDITOR_FONT}
        label="editor"
      />

      <IconButton onClick={handleResetCode} title="Reset to starter code">
        <RotateCcw className="size-4" />
      </IconButton>

      <Link
        href="/premium"
        title="Get Premium"
        className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
      >
        <Crown className="size-3.5" />
        <span className="hidden lg:inline">Premium</span>
      </Link>

      {runButton}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col gap-3 bg-background p-3">
      {/* ── Desktop ──────────────────────────────────────────────── */}
      <div ref={containerRef} className="hidden min-h-0 flex-1 md:flex">
        {/* Editor panel */}
        <div
          style={{ width: isMaximized ? '100%' : `${editorWidth}%` }}
          className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card"
        >
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <TrafficLights />
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-8 w-[132px] rounded-md text-xs">
                  <span className="flex items-center gap-2 truncate">
                    {currentLang?.iconUrl && (
                      <img src={currentLang.iconUrl} alt="" className="size-4" />
                    )}
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value} className="text-xs">
                      <span className="flex items-center gap-2">
                        <img src={lang.iconUrl} alt="" className="size-4" />
                        {lang.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="hidden truncate font-mono text-xs text-muted-foreground xl:inline">
                {filename}
              </span>
            </div>
            {editorToolbar}
          </div>

          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              language={currentLang?.monacoLang || 'python'}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              theme={currentTheme}
              options={mergedEditorOptions}
            />
          </div>
        </div>

        {/* Resize handle */}
        {!isMaximized && (
          <div
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            className="group mx-1 flex w-2 flex-shrink-0 cursor-col-resize items-center justify-center"
          >
            <div
              className={`h-10 w-1 rounded-full transition-colors ${
                isResizing ? 'bg-primary' : 'bg-border group-hover:bg-primary/60'
              }`}
            />
          </div>
        )}

        {/* Terminal panel */}
        {!isMaximized && (
          <div
            style={{ width: `${100 - editorWidth}%` }}
            className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card"
          >
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
              <div className="flex items-center gap-3">
                <TrafficLights />
                <span className="text-sm font-medium">Bash</span>
                {waitingForInput && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    waiting for input
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <FontSizeControl
                  value={terminalFontSize}
                  onChange={setTerminalFontSize}
                  bounds={TERMINAL_FONT}
                  label="terminal"
                />
                <IconButton
                  onClick={handleRunClick}
                  title="Re-run code"
                  disabled={!isLoggedIn || isRunning}
                >
                  <RotateCcw className="size-4" />
                </IconButton>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <TerminalConsole
                terminalOutput={terminalOutput}
                terminalInput={terminalInput}
                waitingForInput={waitingForInput}
                onInputChange={setTerminalInput}
                onInputSubmit={handleTerminalInputSubmit}
                isRunning={isRunning}
                fontSize={terminalFontSize}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile ───────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card md:hidden">
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <TrafficLights />
          <div className="flex rounded-md border p-0.5">
            {(['editor', 'terminal'] as const).map(pane => (
              <button
                key={pane}
                onClick={() => setMobilePane(pane)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  mobilePane === pane
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {pane}
                {pane === 'terminal' && waitingForInput && (
                  <span className="ml-1.5 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
          {runButton}
        </div>

        {mobilePane === 'editor' && (
          <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-8 w-[128px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value} className="text-xs">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <FontSizeControl
                value={editorFontSize}
                onChange={setEditorFontSize}
                bounds={EDITOR_FONT}
                label="editor"
              />
              <IconButton onClick={handleResetCode} title="Reset to starter code">
                <RotateCcw className="size-4" />
              </IconButton>
            </div>
          </div>
        )}

        <div className={`min-h-0 flex-1 ${mobilePane === 'editor' ? '' : 'hidden'}`}>
          <Editor
            height="100%"
            language={currentLang?.monacoLang || 'python'}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme={currentTheme}
            options={mergedMobileOptions}
          />
        </div>

        <div className={`min-h-0 flex-1 ${mobilePane === 'terminal' ? '' : 'hidden'}`}>
          <TerminalConsole
            terminalOutput={terminalOutput}
            terminalInput={terminalInput}
            waitingForInput={waitingForInput}
            onInputChange={setTerminalInput}
            onInputSubmit={handleTerminalInputSubmit}
            isRunning={isRunning}
            fontSize={terminalFontSize}
          />
        </div>
      </div>
    </div>
  );
}
