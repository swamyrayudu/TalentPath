'use client';
import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
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
  Code2,
  Terminal,
  FileCode
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCodeEditor } from './useCodeEditor';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">Loading editor...</div>
});

const LanguageIcon = ({ url, label }: { url?: string; label?: string }) => {
  if (!url) return null;
  return <img src={url} alt={label || ''} className="w-4 h-4" />;
};

const DarkTerminalConsole = ({ 
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
      className="h-full bg-[#0a0a0a] text-gray-100 p-4 font-mono text-sm overflow-auto"
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
        <div>
          {terminalOutput.map((line, idx) => (
            <pre key={idx} className="whitespace-pre-wrap m-0 p-0">{line}</pre>
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
};

export function CodeEditor() {
  const [editorWidth, setEditorWidth] = React.useState(50);
  const [isResizing, setIsResizing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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
    <div className="h-screen bg-[#1e1e1e] flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-[#2d2d30] border-b border-[#3e3e42] px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-[#3c3c3c] border-[#3e3e42] text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252526] border-[#3e3e42]">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value} className="text-gray-300">
                    <span className="flex items-center gap-2">
                      <img src={lang.iconUrl} alt={lang.label} className="w-4 h-4" />
                      <span className="font-medium text-xs">{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              size="sm" 
              onClick={toggleSuggestions}
              title="Toggle IntelliSense"
              className="h-7 w-7 p-0 bg-[#3c3c3c] border border-[#3e3e42] hover:bg-[#505050]"
            >
              {suggestionsEnabled ? (
                <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
              ) : (
                <LightbulbOff className="h-3.5 w-3.5 text-gray-400" />
              )}
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={toggleSnippets}
              title="Toggle Snippets"
              className="h-7 w-7 p-0 bg-[#3c3c3c] border border-[#3e3e42] hover:bg-[#505050]"
            >
              <Code2 className={`h-3.5 w-3.5 ${snippetsEnabled ? 'text-blue-400' : 'text-gray-400'}`} />
            </Button>
            
            <Button 
              onClick={handleRunClick} 
              disabled={isRunning}
              size="sm"
              className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white border-none"
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
          </div>
        </div>
      </div>

      {/* Desktop: Resizable Split View */}
      <div ref={containerRef} className="hidden md:flex flex-1 overflow-hidden">
        <div style={{ width: `${editorWidth}%` }} className="flex flex-col bg-[#1e1e1e] border-r border-[#3e3e42]">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3e3e42]">
            <div className="flex items-center gap-2">
              <LanguageIcon url={currentLang?.iconUrl} label={currentLang?.label} />
              <span className="text-xs text-gray-400 font-medium">{currentLang?.label}</span>
            </div>
            <span className="text-[10px] text-gray-500">Ctrl+Enter to run</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={currentLang?.monacoLang || 'python'}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={editorOptions}
            />
          </div>
        </div>

        <div 
          className="w-1 bg-[#3e3e42] hover:bg-blue-500 cursor-col-resize transition-colors relative"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        <div style={{ width: `${100 - editorWidth}%` }} className="flex flex-col bg-[#0a0a0a]">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d0d] border-b border-[#252526]">
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
      <div className="md:hidden flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-[#2d2d30] border-b border-[#3e3e42] rounded-none h-10">
            <TabsTrigger 
              value="editor" 
              className="font-medium text-xs text-gray-400 data-[state=active]:text-white data-[state=active]:bg-[#1e1e1e]"
            >
              <FileCode className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger 
              value="output"
              className="font-medium text-xs text-gray-400 data-[state=active]:text-white data-[state=active]:bg-[#1e1e1e]"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Terminal
              {waitingForInput && (
                <span className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 m-0 data-[state=active]:flex flex-col">
            <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={currentLang?.monacoLang || 'python'}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={mobileEditorOptions}
              />
            </div>
          </TabsContent>

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
