'use client';
import React from 'react';
import { memo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  CheckCircle2, 
  Lightbulb, 
  LightbulbOff, 
  CornerDownLeft, 
  Code2,
  Terminal,
  Settings,
  FileCode,
  Lock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCodeEditor } from './useCodeEditor';
import { useColorTheme, colorThemeColors, ColorTheme } from '@/components/context/ColorThemeContext';
import { useSession, signIn } from 'next-auth/react';
import type * as Monaco from 'monaco-editor';

// Dynamically import Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[500px] bg-muted text-muted-foreground">Loading editor...</div>
});

// Function to define custom themes with color theme string colors
const defineCustomTheme = (monaco: typeof Monaco, colorTheme: ColorTheme, isDark: boolean) => {
  const stringColor = colorThemeColors[colorTheme];
  const themeName = isDark ? 'custom-dark' : 'custom-light';
  
  if (isDark) {
    monaco.editor.defineTheme(themeName, {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string', foreground: stringColor.replace('#', '') },
        { token: 'string.escape', foreground: stringColor.replace('#', '') },
        { token: 'string.quoted', foreground: stringColor.replace('#', '') },
        { token: 'string.quoted.double', foreground: stringColor.replace('#', '') },
        { token: 'string.quoted.single', foreground: stringColor.replace('#', '') },
      ],
      colors: {}
    });
  } else {
    monaco.editor.defineTheme(themeName, {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string', foreground: stringColor.replace('#', '') },
        { token: 'string.escape', foreground: stringColor.replace('#', '') },
        { token: 'string.quoted', foreground: stringColor.replace('#', '') },
        { token: 'string.quoted.double', foreground: stringColor.replace('#', '') },
        { token: 'string.quoted.single', foreground: stringColor.replace('#', '') },
      ],
      colors: {}
    });
  }
  
  return themeName;
};

// Memoized Input Field Component - prevents unnecessary re-renders
const InputField = memo(({ 
  index, 
  prompt, 
  value, 
  onChange, 
  onKeyDown, 
  autoFocus,
  inputRef
}: {
  index: number;
  prompt: string;
  value: string;
  onChange: (index: number, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  autoFocus: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, e.target.value);
  }, [index, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown(e, index);
  }, [index, onKeyDown]);

  return (
    <div className="space-y-2 bg-card p-3 rounded-lg border">
      <label className="text-xs font-semibold text-foreground flex items-center gap-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">
          {index + 1}
        </span>
        {prompt}
      </label>
      <Input
        ref={inputRef}
        placeholder="Enter value..."
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="font-mono text-sm"
        autoFocus={autoFocus}
      />
    </div>
  );
});

InputField.displayName = 'InputField';

// Memoized Language Icon Component
const LanguageIcon = memo(({ url, label }: { url?: string; label?: string }) => {
  if (!url) return null;
  return <img src={url} alt={label || ''} className="w-5 h-5" />;
});

LanguageIcon.displayName = 'LanguageIcon';

// Memoized Input Console Content
const InputConsoleContent = memo(({ 
  showInputModal, 
  prompts, 
  userInputs, 
  allInputsFilled,
  inputRefs,
  handleInputChange,
  handleInputKeyDown,
  handleSubmitInputs
}: {
  showInputModal: boolean;
  prompts: string[];
  userInputs: string[];
  allInputsFilled: boolean;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleInputChange: (index: number, value: string) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleSubmitInputs: () => void;
}) => {
  if (showInputModal && prompts.length > 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 border rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              Provide Input Values
            </p>
          </div>
          <div 
            className={`space-y-3 ${prompts.length > 4 ? 'max-h-[250px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}
          >
            {prompts.map((prompt, index) => (
              <InputField
                key={index}
                index={index}
                prompt={prompt}
                value={userInputs[index] || ''}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                autoFocus={index === 0}
                inputRef={(el) => {
                  if (el) {
                    inputRefs.current[index] = el;
                  }
                }}
              />
            ))}
          </div>
          <Button 
            onClick={handleSubmitInputs} 
            disabled={!allInputsFilled}
            className="w-full mt-4"
            size="sm"
          >
            <CornerDownLeft className="h-4 w-4 mr-2" />
            Submit & Execute
            {allInputsFilled && <span className="ml-2 text-xs opacity-90">(Enter ↵)</span>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[180px] flex items-center justify-center bg-muted/50 rounded-xl border-2 border-dashed">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            No Input Required
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click <strong className="text-primary">Run Code</strong> to execute
          </p>
        </div>
      </div>
    </div>
  );
});

InputConsoleContent.displayName = 'InputConsoleContent';

// Dark Terminal Console with Live Input
const DarkTerminalConsole = memo(({ 
  terminalOutput,
  terminalInput,
  waitingForInput,
  onInputChange,
  onInputSubmit,
  isRunning
}: { 
  terminalOutput: string[];
  terminalInput: string;
  waitingForInput: boolean;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  isRunning: boolean;
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

  return (
    <div 
      ref={terminalRef}
      className="bg-[#0a0a0a] text-gray-100 p-5 font-mono text-sm h-full w-full overflow-y-auto"
      style={{
        fontFamily: 'Consolas, "Courier New", monospace',
        lineHeight: '1.6'
      }}
    >
      {terminalOutput.length === 0 ? (
        <div className="flex items-center gap-3 text-gray-500">
          <Terminal className="h-5 w-5" />
          <span>Live Code Execution Terminal</span>
        </div>
      ) : (
        <div className="space-y-0">
          {terminalOutput.map((line, idx) => (
            <pre key={idx} className="whitespace-pre-wrap m-0 p-0">
              {line}
            </pre>
          ))}
        </div>
      )}
      
      {waitingForInput && (
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={inputRef}
            type="text"
            value={terminalInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-green-400 flex-1 font-mono caret-green-400"
            placeholder=""
            autoFocus
            disabled={isRunning}
          />
          <span className="text-green-400 animate-pulse">█</span>
        </div>
      )}
      
      {isRunning && !waitingForInput && (
        <div className="flex items-center gap-2 mt-2 text-yellow-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
});

DarkTerminalConsole.displayName = 'DarkTerminalConsole';

// Main CodeEditor Component
export function CodeEditor() {
  const { resolvedTheme } = useTheme();
  const { colorTheme } = useColorTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const [editorWidth, setEditorWidth] = React.useState(50); // 50/50 split - centered
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const monacoRef = React.useRef<typeof Monaco | null>(null);
  const [currentTheme, setCurrentTheme] = React.useState<string>('vs-dark');

  const isSessionLoading = status === 'loading';
  const isLoggedIn = status === 'authenticated' && !!session;

  // Handle login redirect
  const handleLoginClick = useCallback(() => {
    setIsRedirecting(true);
    signIn('google', { callbackUrl: window.location.href });
  }, []);

  // Handle hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  // Update Monaco theme when color theme changes
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
    setActiveTab,
    setTerminalInput,
    editorOptions,
    mobileEditorOptions,
    LANGUAGES,
  } = useCodeEditor();

  // Wrap the original handleEditorDidMount to capture monaco instance
  const handleEditorMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    monacoRef.current = monaco;
    // Define and apply custom theme
    const themeName = defineCustomTheme(monaco, colorTheme, isDark);
    setCurrentTheme(themeName);
    monaco.editor.setTheme(themeName);
    // Call the original handler
    handleEditorDidMount(editor, monaco);
  }, [handleEditorDidMount, colorTheme, isDark]);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Limit between 30% and 70%
    if (newWidth >= 30 && newWidth <= 70) {
      setEditorWidth(newWidth);
    }
  }, [isResizing]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-muted border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left Side - Language & Controls */}
          <div className="flex items-center gap-3">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="flex items-center gap-2">
                      <img src={lang.iconUrl} alt={lang.label} className="w-4 h-4" />
                      <span className="font-medium text-xs">{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant={suggestionsEnabled ? "secondary" : "outline"} 
              size="sm" 
              onClick={toggleSuggestions}
              title="Toggle IntelliSense"
              className="h-7 w-7 p-0"
            >
              {suggestionsEnabled ? (
                <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
              ) : (
                <LightbulbOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
            <Button 
              variant={snippetsEnabled ? "secondary" : "outline"} 
              size="sm" 
              onClick={toggleSnippets}
              title="Toggle Snippets"
              className="h-7 w-7 p-0"
            >
              <Code2 className={`h-3.5 w-3.5 ${snippetsEnabled ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </Button>
            
            {isSessionLoading ? (
              <Button 
                disabled
                size="sm"
                className="h-7 px-3 text-xs"
                variant="default"
              >
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Run
              </Button>
            ) : isLoggedIn ? (
              <Button 
                onClick={handleRunClick} 
                disabled={isRunning}
                size="sm"
                className="h-7 px-3 text-xs"
                variant="default"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Running
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1.5" fill="currentColor" />
                    Run
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleLoginClick}
                disabled={isRedirecting}
                size="sm"
                className="h-7 px-3 text-xs cursor-pointer"
                variant="default"
                title="Login to run code"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Run
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Run
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Resizable Split View */}
      <div ref={containerRef} className="hidden md:flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div style={{ width: `${editorWidth}%` }} className={`flex flex-col border-r border-border h-full ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={currentLang?.monacoLang || 'python'}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              theme={currentTheme}
              options={editorOptions}
            />
          </div>
        </div>

        {/* Resizable Divider */}
        <div 
          className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors relative group flex-shrink-0"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Terminal Panel - Always Dark */}
        <div style={{ width: `${100 - editorWidth}%` }} className="flex flex-col bg-[#0a0a0a] h-full">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d0d] border-b border-[#252526] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Bash</span>
            </div>
            {waitingForInput && (
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Waiting for input
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <DarkTerminalConsole
              terminalOutput={terminalOutput}
              terminalInput={terminalInput}
              waitingForInput={waitingForInput}
              onInputChange={setTerminalInput}
              onInputSubmit={handleTerminalInputSubmit}
              isRunning={isRunning}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Tabbed View */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none h-10">
            <TabsTrigger 
              value="editor" 
              className="font-medium"
            >
              <FileCode className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger 
              value="output"
              className="font-medium relative"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Terminal
              {waitingForInput && (
                <span className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 m-0 data-[state=active]:flex flex-col">
            <div className={`flex-1 overflow-hidden ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
              <Editor
                height="100%"
                language={currentLang?.monacoLang || 'python'}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                theme={currentTheme}
                options={mobileEditorOptions}
              />
            </div>
          </TabsContent>

          {/* Terminal - Always Dark */}
          <TabsContent value="output" className="flex-1 m-0 data-[state=active]:flex flex-col bg-[#0a0a0a]">
            <DarkTerminalConsole
              terminalOutput={terminalOutput}
              terminalInput={terminalInput}
              waitingForInput={waitingForInput}
              onInputChange={setTerminalInput}
              onInputSubmit={handleTerminalInputSubmit}
              isRunning={isRunning}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
