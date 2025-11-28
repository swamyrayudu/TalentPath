'use client';
import React from 'react';
import { memo, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  LightbulbOff, 
  CornerDownLeft, 
  Code2,
  Terminal,
  Settings,
  Zap,
  FileCode,
  MonitorPlay
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCodeEditor } from './useCodeEditor';

// Dynamically import Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[500px] bg-gray-900 text-gray-400">Loading editor...</div>
});

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

// Memoized Output Console
const OutputConsole = memo(({ output }: { output: string }) => {
  return (
    <div className="bg-black text-gray-100 p-4 font-mono text-xs sm:text-sm h-[400px] sm:h-[calc(100vh-480px)] overflow-auto custom-scrollbar">
      <pre className="whitespace-pre-wrap leading-relaxed">
        {output || (
          <span className="text-muted-foreground flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Output will appear here after execution...
          </span>
        )}
      </pre>
    </div>
  );
});

OutputConsole.displayName = 'OutputConsole';

// Main CodeEditor Component
export function CodeEditor() {
  const {
    language,
    code,
    userInputs,
    output,
    isRunning,
    suggestionsEnabled,
    snippetsEnabled,
    showInputModal,
    activeTab,
    prompts,
    allInputsFilled,
    currentLang,
    inputRefs,
    handleLanguageChange,
    handleCodeChange,
    toggleSuggestions,
    toggleSnippets,
    handleRunClick,
    handleSubmitInputs,
    handleInputKeyDown,
    handleInputChange,
    handleEditorDidMount,
    setActiveTab,
    editorOptions,
    mobileEditorOptions,
    LANGUAGES,
  } = useCodeEditor();

  // Memoize computed values
  const inputBadgeContent = useMemo(() => {
    if (prompts.length === 0) {
      return (
        <Badge variant="outline" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
          Ready
        </Badge>
      );
    }

    return (
      <Badge 
        variant={showInputModal ? "default" : "outline"} 
        className="gap-1 text-xs"
      >
        {showInputModal ? (
          <AlertCircle className="h-3 w-3" />
        ) : (
          <CheckCircle2 className="h-3 w-3" />
        )}
        {prompts.length} input{prompts.length > 1 ? 's' : ''}
      </Badge>
    );
  }, [prompts.length, showInputModal]);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-[1800px] mx-auto space-y-3 sm:space-y-4">
        {/* Compact Header */}
        <Card className="shadow-lg">
          <CardHeader className="p-2 sm:p-3">
            <div className="flex items-center gap-2 justify-between">
              {/* Language Selector */}
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <img 
                          src={lang.iconUrl} 
                          alt={lang.label}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-sm">{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button 
                  variant={suggestionsEnabled ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleSuggestions}
                  title="Toggle IntelliSense"
                  className="h-8 w-8 p-0"
                >
                  {suggestionsEnabled ? (
                    <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <LightbulbOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </Button>
                <Button 
                  variant={snippetsEnabled ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleSnippets}
                  title="Toggle Snippets"
                  className="h-8 w-8 p-0"
                >
                  <Code2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${!snippetsEnabled && 'opacity-50'}`} />
                </Button>
                
                <Button 
                  onClick={handleRunClick} 
                  disabled={isRunning}
                  size="sm"
                  className="h-8 px-3 sm:px-4 text-xs sm:text-sm"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 animate-spin" />
                      <span className="hidden xs:inline">Running...</span>
                      <span className="xs:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" fill="currentColor" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Grid - Desktop View */}
        <div className="hidden xl:grid grid-cols-2 gap-3 sm:gap-4">
          {/* Code Editor Section */}
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LanguageIcon url={currentLang?.iconUrl} label={currentLang?.label} />
                  <CardTitle className="text-sm font-semibold">
                    {currentLang?.label} Editor
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-1">
                  <Zap className="h-3 w-3" />
                  Ctrl+Enter
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <Editor
                  height="calc(100vh - 280px)"
                  language={currentLang?.monacoLang || 'python'}
                  value={code}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={editorOptions}
                />
              </div>
            </CardContent>
          </Card>

          {/* Input/Output Section */}
          <div className="space-y-3 sm:space-y-4">
            {/* Custom Input Card */}
            <Card className="shadow-xl">
              <CardHeader className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Input Console</CardTitle>
                  </div>
                  {inputBadgeContent}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <InputConsoleContent
                  showInputModal={showInputModal}
                  prompts={prompts}
                  userInputs={userInputs}
                  allInputsFilled={allInputsFilled}
                  inputRefs={inputRefs}
                  handleInputChange={handleInputChange}
                  handleInputKeyDown={handleInputKeyDown}
                  handleSubmitInputs={handleSubmitInputs}
                />
              </CardContent>
            </Card>

            {/* Output Card */}
            <Card className="shadow-xl">
              <CardHeader className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary rounded-lg">
                    <Terminal className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Output Console</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <OutputConsole output={output} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Tabbed View */}
        <div className="xl:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 shadow-lg h-12 p-1">
              <TabsTrigger 
                value="editor" 
                className="font-medium"
              >
                <FileCode className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger 
                value="input"
                className="font-medium relative"
              >
                <Terminal className="h-4 w-4 mr-2" />
                Input
                {prompts.length > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
                    {prompts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="output"
                className="font-medium"
              >
                <MonitorPlay className="h-4 w-4 mr-2" />
                Output
              </TabsTrigger>
            </TabsList>

            {/* Editor Tab */}
            <TabsContent value="editor" className="mt-4">
              <Card className="shadow-xl overflow-hidden">
                <CardHeader className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LanguageIcon url={currentLang?.iconUrl} label={currentLang?.label} />
                      <CardTitle className="text-sm font-semibold">
                        {currentLang?.label} Editor
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-1">
                      <Zap className="h-3 w-3" />
                      Ctrl+Enter
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <Editor
                      height="calc(100vh - 350px)"
                      language={currentLang?.monacoLang || 'python'}
                      value={code}
                      onChange={handleCodeChange}
                      onMount={handleEditorDidMount}
                      theme="vs-dark"
                      options={mobileEditorOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Input Tab */}
            <TabsContent value="input" className="mt-4">
              <Card className="shadow-xl">
                <CardHeader className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-semibold">Input Console</CardTitle>
                    </div>
                    {inputBadgeContent}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {showInputModal && prompts.length > 0 ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 border rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-foreground">
                            Provide Input Values
                          </p>
                        </div>
                        <div 
                          className={`space-y-3 ${prompts.length > 4 ? 'max-h-[calc(100vh-450px)] overflow-y-auto pr-2 custom-scrollbar' : ''}`}
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
                  ) : (
                    <div className="h-[calc(100vh-400px)] flex items-center justify-center bg-muted/50 rounded-xl border-2 border-dashed">
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Output Tab */}
            <TabsContent value="output" className="mt-4">
              <Card className="shadow-xl">
                <CardHeader className="p-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary rounded-lg">
                      <Terminal className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Output Console</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-black text-gray-100 p-4 font-mono text-xs sm:text-sm h-[calc(100vh-350px)] overflow-auto custom-scrollbar">
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {output || (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Terminal className="h-4 w-4" />
                          Output will appear here after execution...
                        </span>
                      )}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.8);
        }
      `}} />
    </div>
  );
}
