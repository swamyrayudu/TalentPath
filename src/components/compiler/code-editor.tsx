'use client';

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
    <div className="space-y-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
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
        className="font-mono text-sm border-2 focus:border-blue-400 transition-colors"
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
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
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
            className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
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
    <div className="h-[180px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            No Input Required
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Click <strong className="text-green-600 dark:text-green-400">Run Code</strong> to execute
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
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100 p-4 font-mono text-xs sm:text-sm h-[400px] sm:h-[calc(100vh-480px)] overflow-auto custom-scrollbar">
      <pre className="whitespace-pre-wrap leading-relaxed">
        {output || (
          <span className="text-gray-500 flex items-center gap-2">
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
        className="gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none text-xs"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-black p-2 sm:p-4">
      <div className="max-w-[1800px] mx-auto space-y-3 sm:space-y-4">
        {/* Compact Header */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl">
          <CardHeader className="p-2 sm:p-3">
            <div className="flex items-center gap-2 justify-between">
              {/* Language Selector */}
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-8 text-xs sm:text-sm border hover:border-blue-400 transition-all">
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
                  className="h-8 px-3 sm:px-4 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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
          <Card className="border-none shadow-xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-gray-900 dark:to-gray-950 backdrop-blur-xl overflow-hidden">
            <CardHeader className="p-3 border-b border-slate-200 dark:border-gray-800">
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
            <Card className="border-none shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 backdrop-blur-xl">
              <CardHeader className="p-3 border-b border-blue-200 dark:border-blue-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
            <Card className="border-none shadow-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 backdrop-blur-xl">
              <CardHeader className="p-3 border-b border-emerald-200 dark:border-emerald-900">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <Terminal className="h-3.5 w-3.5 text-white" />
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
            <TabsList className="grid w-full grid-cols-3 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-lg h-12 p-1">
              <TabsTrigger 
                value="editor" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white font-medium"
              >
                <FileCode className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger 
                value="input"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white font-medium relative"
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
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-700 data-[state=active]:text-white font-medium"
              >
                <MonitorPlay className="h-4 w-4 mr-2" />
                Output
              </TabsTrigger>
            </TabsList>

            {/* Editor Tab */}
            <TabsContent value="editor" className="mt-4">
              <Card className="border-none shadow-xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-gray-900 dark:to-gray-950 backdrop-blur-xl overflow-hidden">
                <CardHeader className="p-3 border-b border-slate-200 dark:border-gray-800">
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
              <Card className="border-none shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 backdrop-blur-xl">
                <CardHeader className="p-3 border-b border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-sm sm:text-base font-semibold">Input Console</CardTitle>
                    </div>
                    {inputBadgeContent}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {showInputModal && prompts.length > 0 ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
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
                          className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
                          size="sm"
                        >
                          <CornerDownLeft className="h-4 w-4 mr-2" />
                          Submit & Execute
                          {allInputsFilled && <span className="ml-2 text-xs opacity-90">(Enter ↵)</span>}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[calc(100vh-400px)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <div className="text-center space-y-3">
                        <div className="flex justify-center">
                          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            No Input Required
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Click <strong className="text-green-600 dark:text-green-400">Run Code</strong> to execute
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
              <Card className="border-none shadow-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 backdrop-blur-xl">
                <CardHeader className="p-3 border-b border-emerald-200 dark:border-emerald-900">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <Terminal className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Output Console</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100 p-4 font-mono text-xs sm:text-sm h-[calc(100vh-350px)] overflow-auto custom-scrollbar">
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {output || (
                        <span className="text-gray-500 flex items-center gap-2">
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
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  );
}
