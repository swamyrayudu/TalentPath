'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
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
  Copy, 
  RotateCcw, 
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
import { toast } from 'sonner';
import { LANGUAGE_SNIPPETS } from './snippets';
import { registerCompletionProviders } from './intellisense';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LANGUAGES = [
  { 
    value: 'python', 
    label: 'Python', 
    monacoLang: 'python',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg'
  },
  { 
    value: 'javascript', 
    label: 'JavaScript', 
    monacoLang: 'javascript',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg'
  },
  { 
    value: 'java', 
    label: 'Java', 
    monacoLang: 'java',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg'
  },
  { 
    value: 'cpp', 
    label: 'C++', 
    monacoLang: 'cpp',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg'
  },
  { 
    value: 'c', 
    label: 'C', 
    monacoLang: 'c',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg'
  },
  { 
    value: 'go', 
    label: 'Go', 
    monacoLang: 'go',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg'
  },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `name = input("Enter your name: ")
age = int(input("Enter your age: "))

print(f"Hello, {name}!")
print(f"You are {age} years old!")`,
  
  javascript: `console.log("Hello, World!");
const sum = 10 + 20;
console.log("Sum:", sum);`,
  
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        System.out.print("Enter name: ");
        String name = sc.nextLine();
        
        System.out.print("Enter age: ");
        int age = sc.nextInt();
        
        System.out.println("Hello, " + name + "!");
        System.out.println("Age: " + age);
        
        sc.close();
    }
}`,

  cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;
    
    cout << "Enter name: ";
    getline(cin, name);
    
    cout << "Enter age: ";
    cin >> age;
    
    cout << "Hello, " << name << "!" << endl;
    cout << "Age: " << age << endl;
    
    return 0;
}`,

  c: `#include <stdio.h>

int main() {
    char name[100];
    int age;
    
    printf("Enter name: ");
    fgets(name, sizeof(name), stdin);
    
    printf("Enter age: ");
    scanf("%d", &age);
    
    printf("Hello, %s", name);
    printf("Age: %d\\n", age);
    
    return 0;
}`,

  go: `package main

import "fmt"

func main() {
    var name string
    var age int
    
    fmt.Print("Enter name: ")
    fmt.Scanln(&name)
    
    fmt.Print("Enter age: ")
    fmt.Scanln(&age)
    
    fmt.Printf("Hello, %s!\\n", name)
    fmt.Printf("Age: %d\\n", age)
}`,
};

export function CodeEditor() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [snippetsEnabled, setSnippetsEnabled] = useState(true);
  const [showInputModal, setShowInputModal] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const completionProviderRef = useRef<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const prompts = useMemo(() => extractPrompts(code, language), [code, language]);

  useEffect(() => {
    setUserInputs(new Array(prompts.length).fill(''));
    inputRefs.current = new Array(prompts.length).fill(null);
  }, [prompts]);

  function extractPrompts(code: string, language: string): string[] {
    try {
      const prompts: string[] = [];
      
      if (language === 'python') {
        // Match input() with or without prompt text
        const regexWithPrompt = /input\s*\(\s*["']([^"']*)["']\s*\)/g;
        const regexWithoutPrompt = /input\s*\(\s*\)/g;
        
        let match;
        let inputCount = 0;
        
        // First, find all input() calls with prompts
        while ((match = regexWithPrompt.exec(code)) !== null) {
          prompts.push(match[1] || `Input ${inputCount + 1}`);
          inputCount++;
        }
        
        // Then count input() calls without prompts
        const withoutPromptMatches = code.match(regexWithoutPrompt) || [];
        const emptyInputCount = withoutPromptMatches.length - inputCount;
        
        // Add generic prompts for input() without text
        for (let i = 0; i < emptyInputCount; i++) {
          prompts.push(`Input ${inputCount + i + 1}`);
        }
        
      } else if (language === 'java') {
        // Detect Scanner input methods
        const scannerRegex = /sc\.next(?:Line|Int|Double|Float|Boolean)\s*\(\s*\)/g;
        let match;
        let inputCount = 0;
        
        while ((match = scannerRegex.exec(code)) !== null) {
          inputCount++;
          prompts.push(`Input ${inputCount}`);
        }
        
        // Also check for System.out.print before scanner calls
        const printRegex = /System\.out\.print\s*\(\s*"([^"]*)"\s*\)/g;
        const printMatches: string[] = [];
        while ((match = printRegex.exec(code)) !== null) {
          if (match[1].trim()) printMatches.push(match[1]);
        }
        
        // If we have print statements, use them as prompts
        if (printMatches.length > 0) {
          return printMatches.slice(0, inputCount);
        }
        
      } else if (language === 'cpp' || language === 'c') {
        const coutRegex = /cout\s*<<\s*"([^"]*)"/g;
        const printfRegex = /printf\s*\(\s*"([^"]*)"/g;
        const cinRegex = /cin\s*>>/g;
        const scanfRegex = /scanf\s*\(/g;
        
        let match;
        const coutMatches: string[] = [];
        const cinCount = (code.match(cinRegex) || []).length;
        const scanfCount = (code.match(scanfRegex) || []).length;
        const totalInputs = cinCount + scanfCount;
        
        while ((match = coutRegex.exec(code)) !== null) {
          if (match[1].trim()) coutMatches.push(match[1]);
        }
        
        while ((match = printfRegex.exec(code)) !== null) {
          if (match[1].trim() && !match[1].includes('%')) coutMatches.push(match[1]);
        }
        
        // Use cout/printf prompts or generate generic ones
        for (let i = 0; i < totalInputs; i++) {
          prompts.push(coutMatches[i] || `Input ${i + 1}`);
        }
        
      } else if (language === 'go') {
        const regex = /fmt\.(?:Print|Scan)/g;
        const matches = code.match(regex) || [];
        const scanCount = matches.filter(m => m.includes('Scan')).length;
        
        for (let i = 0; i < scanCount; i++) {
          prompts.push(`Input ${i + 1}`);
        }
      }
      
      return prompts;
    } catch {
      return [];
    }
  }

  const allInputsFilled = useMemo(() => {
    if (prompts.length === 0) return true;
    return userInputs.every(input => input.trim() !== '');
  }, [userInputs, prompts]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage] || '');
    setUserInputs([]);
    setOutput('');
    setShowInputModal(false);
  };

  const handleRunClick = () => {
    if (!code.trim()) {
      toast.error('Please write some code first!');
      return;
    }

    if (prompts.length === 0) {
      executeCode([]);
    } else {
      setShowInputModal(true);
      setActiveTab('input');
      toast.info(`Please provide ${prompts.length} input(s)`);
    }
  };

  const handleSubmitInputs = () => {
    if (!allInputsFilled) {
      toast.error('Please fill all input fields!');
      return;
    }

    setShowInputModal(false);
    setActiveTab('output');
    executeCode(userInputs);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (index === prompts.length - 1 && allInputsFilled) {
        handleSubmitInputs();
      } else {
        const nextIndex = index + 1;
        if (nextIndex < prompts.length && inputRefs.current[nextIndex]) {
          inputRefs.current[nextIndex]?.focus();
        }
      }
    }
  };

  const executeCode = async (inputs: string[]) => {
    const stdin = inputs.join('\n');

    setIsRunning(true);
    setOutput('⏳ Compiling and running...\n');
    setActiveTab('output');

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          code,
          stdin,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.timeout) {
        setOutput(result.stderr);
        toast.error('Execution timeout (10 seconds)!');
        setIsRunning(false);
        return;
      }

      if (result.limitExceeded) {
        const displayOutput = result.output ? result.output + '\n\n' + result.stderr : result.stderr;
        setOutput(displayOutput);
        toast.warning('Output limit exceeded!');
        setIsRunning(false);
        return;
      }

      if (result.success) {
        let rawOutput = result.output || '';
        
        if (prompts.length > 0 && inputs.length > 0) {
          prompts.forEach(prompt => {
            const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            rawOutput = rawOutput.replace(new RegExp(escapedPrompt + '\\s*', 'g'), '');
          });
          
          inputs.forEach(input => {
            if (input) {
              const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              rawOutput = rawOutput.replace(new RegExp('^' + escapedInput + '$', 'gm'), '');
            }
          });
          
          rawOutput = rawOutput
            .split('\n')
            .filter((line: string) => line.trim() !== '')
            .join('\n')
            .trim();
        }
        
        const finalOutput = rawOutput.trim();
        
        if (finalOutput) {
          setOutput(finalOutput + '\n\n✅ Code Execution Successful');
        } else {
          setOutput('✅ Code Execution Successful');
        }
        
        toast.success('Executed successfully!');
        
        if (prompts.length > 0) {
          setUserInputs(new Array(prompts.length).fill(''));
        }
      } else {
        const errorOutput = result.stderr || result.output || result.error || 'this is free server so output run up to 283 pleace understand the problem';
        setOutput(errorOutput);
        toast.error('Execution failed');
      }
    } catch (error: any) {
      setOutput(`❌ Network Error\n\n${error.message}\n\nPlease check your connection and try again.`);
      toast.error('Failed to execute');
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCode = () => {
    setCode(DEFAULT_CODE[language] || '');
    setUserInputs([]);
    setOutput('');
    setShowInputModal(false);
    toast.success('Reset!');
  };

  const toggleSuggestions = () => {
    const newValue = !suggestionsEnabled;
    setSuggestionsEnabled(newValue);
    
    if (editorRef.current) {
      editorRef.current.updateOptions({
        quickSuggestions: newValue,
        suggestOnTriggerCharacters: newValue,
        parameterHints: { enabled: newValue },
        suggest: {
          showWords: newValue,
          showMethods: newValue,
          showFunctions: newValue,
        },
      });
    }
    
    toast.success(newValue ? 'IntelliSense enabled ✨' : 'IntelliSense disabled');
  };

  const toggleSnippets = () => {
    const newValue = !snippetsEnabled;
    setSnippetsEnabled(newValue);
    
    if (editorRef.current && monacoRef.current) {
      if (newValue) {
        registerSnippets();
        toast.success('Code Snippets enabled 🎯');
      } else {
        if (completionProviderRef.current) {
          completionProviderRef.current.dispose();
          completionProviderRef.current = null;
        }
        toast.success('Code Snippets disabled');
      }
      
      editorRef.current.updateOptions({
        suggest: {
          showSnippets: newValue,
        },
      });
    }
  };

  const registerSnippets = () => {
    if (!monacoRef.current) return;
    
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }
    
    Object.keys(LANGUAGE_SNIPPETS).forEach((lang) => {
      const monacoLang = LANGUAGES.find(l => l.value === lang)?.monacoLang || lang;
      
      const provider = monacoRef.current.languages.registerCompletionItemProvider(monacoLang, {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = LANGUAGE_SNIPPETS[lang].map((snippet: any) => ({
            ...snippet,
            range: range,
          }));

          return { suggestions };
        },
      });
      
      completionProviderRef.current = provider;
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Register IntelliSense completion providers for all languages
    registerCompletionProviders(monaco);
    
    // Register code snippets
    registerSnippets();
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunClick();
    });
  };

  const currentLang = LANGUAGES.find(l => l.value === language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 p-3 sm:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col gap-4">
              {/* Title and Language Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Code Playground
                    </CardTitle>
                  </div>
                </div>

                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full sm:w-[220px] h-11 border-2 hover:border-blue-400 transition-all shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <span className="flex items-center gap-2">
                          <img 
                            src={lang.iconUrl} 
                            alt={lang.label}
                            className="w-5 h-5"
                          />
                          <span className="font-medium">{lang.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <Button 
                    variant={suggestionsEnabled ? "default" : "outline"} 
                    size="sm" 
                    onClick={toggleSuggestions}
                    title="Toggle IntelliSense (Autocomplete)"
                    className="flex-1 sm:flex-none min-w-[100px] shadow-sm"
                  >
                    {suggestionsEnabled ? (
                      <Lightbulb className="h-4 w-4 sm:mr-2" />
                    ) : (
                      <LightbulbOff className="h-4 w-4 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">IntelliSense</span>
                  </Button>
                  <Button 
                    variant={snippetsEnabled ? "default" : "outline"} 
                    size="sm" 
                    onClick={toggleSnippets}
                    title="Toggle Code Snippets"
                    className="flex-1 sm:flex-none min-w-[100px] shadow-sm"
                  >
                    <Code2 className={`h-4 w-4 sm:mr-2 ${!snippetsEnabled && 'opacity-50'}`} />
                    <span className="hidden sm:inline">Snippets</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyCode}
                    className="shadow-sm hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 sm:mr-2 text-green-500" /> : <Copy className="h-4 w-4 sm:mr-2" />}
                    <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetCode}
                    className="shadow-sm hover:bg-orange-50 dark:hover:bg-orange-950"
                  >
                    <RotateCcw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </div>
                
                <Button 
                  onClick={handleRunClick} 
                  disabled={isRunning}
                  size="sm"
                  className="w-full sm:w-auto sm:min-w-[120px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" fill="currentColor" />
                      Run Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Grid - Desktop View */}
        <div className="hidden xl:grid grid-cols-2 gap-4 sm:gap-6">
          {/* Code Editor Section */}
          <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-gray-800 dark:to-gray-850 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src={currentLang?.iconUrl} 
                    alt={currentLang?.label}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                  <CardTitle className="text-sm sm:text-base font-semibold">
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
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    wordWrap: 'on',
                    quickSuggestions: suggestionsEnabled,
                    suggestOnTriggerCharacters: suggestionsEnabled,
                    acceptSuggestionOnEnter: 'on',
                    tabCompletion: 'on',
                    wordBasedSuggestions: 'matchingDocuments',
                    parameterHints: {
                      enabled: suggestionsEnabled,
                    },
                    suggest: {
                      showWords: suggestionsEnabled,
                      showMethods: suggestionsEnabled,
                      showFunctions: suggestionsEnabled,
                      showSnippets: snippetsEnabled,
                    },
                    padding: { top: 16, bottom: 16 },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Input/Output Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Custom Input Card */}
            <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-sm sm:text-base font-semibold">Input Console</CardTitle>
                  </div>
                  {prompts.length > 0 ? (
                    <Badge 
                      variant={showInputModal ? "default" : "outline"} 
                      className="gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none"
                    >
                      {showInputModal ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {prompts.length} input{prompts.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      Ready
                    </Badge>
                  )}
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
                        className={`space-y-3 ${prompts.length > 4 ? 'max-h-[250px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}
                      >
                        {prompts.map((prompt, index) => (
                          <div key={index} className="space-y-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
                                {index + 1}
                              </span>
                              {prompt}
                            </label>
                            <Input
                              ref={(el) => {
                                if (el) {
                                  inputRefs.current[index] = el;
                                }
                              }}
                              placeholder={`Enter value...`}
                              value={userInputs[index] || ''}
                              onChange={(e) => {
                                const newInputs = [...userInputs];
                                newInputs[index] = e.target.value;
                                setUserInputs(newInputs);
                              }}
                              onKeyDown={(e) => handleInputKeyDown(e, index)}
                              className="font-mono text-sm border-2 focus:border-blue-400 transition-colors"
                              autoFocus={index === 0}
                            />
                          </div>
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
                )}
              </CardContent>
            </Card>

            {/* Output Card */}
            <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <Terminal className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm sm:text-base font-semibold">Output Console</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100 p-4 sm:p-6 font-mono text-xs sm:text-sm h-[400px] sm:h-[calc(100vh-520px)] overflow-auto custom-scrollbar">
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
          </div>
        </div>

        {/* Mobile Tabbed View */}
        <div className="xl:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg h-12 p-1">
              <TabsTrigger 
                value="editor" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-600 data-[state=active]:text-white font-medium"
              >
                <FileCode className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger 
                value="input"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium relative"
              >
                <Terminal className="h-4 w-4 mr-2" />
                Input
                {prompts.length > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {prompts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="output"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-medium"
              >
                <MonitorPlay className="h-4 w-4 mr-2" />
                Output
              </TabsTrigger>
            </TabsList>

            {/* Editor Tab */}
            <TabsContent value="editor" className="mt-4">
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-gray-800 dark:to-gray-850 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src={currentLang?.iconUrl} 
                        alt={currentLang?.label}
                        className="w-5 h-5"
                      />
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
                      onChange={(value) => setCode(value || '')}
                      onMount={handleEditorDidMount}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        insertSpaces: true,
                        wordWrap: 'on',
                        quickSuggestions: suggestionsEnabled,
                        suggestOnTriggerCharacters: suggestionsEnabled,
                        acceptSuggestionOnEnter: 'on',
                        tabCompletion: 'on',
                        wordBasedSuggestions: 'matchingDocuments',
                        parameterHints: {
                          enabled: suggestionsEnabled,
                        },
                        suggest: {
                          showWords: suggestionsEnabled,
                          showMethods: suggestionsEnabled,
                          showFunctions: suggestionsEnabled,
                          showSnippets: snippetsEnabled,
                        },
                        padding: { top: 12, bottom: 12 },
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Input Tab */}
            <TabsContent value="input" className="mt-4">
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-sm sm:text-base font-semibold">Input Console</CardTitle>
                    </div>
                    {prompts.length > 0 ? (
                      <Badge 
                        variant={showInputModal ? "default" : "outline"} 
                        className="gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none"
                      >
                        {showInputModal ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {prompts.length} input{prompts.length > 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                        Ready
                      </Badge>
                    )}
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
                            <div key={index} className="space-y-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
                                  {index + 1}
                                </span>
                                {prompt}
                              </label>
                              <Input
                                ref={(el) => {
                                  if (el) {
                                    inputRefs.current[index] = el;
                                  }
                                }}
                                placeholder={`Enter value...`}
                                value={userInputs[index] || ''}
                                onChange={(e) => {
                                  const newInputs = [...userInputs];
                                  newInputs[index] = e.target.value;
                                  setUserInputs(newInputs);
                                }}
                                onKeyDown={(e) => handleInputKeyDown(e, index)}
                                className="font-mono text-sm border-2 focus:border-blue-400 transition-colors"
                                autoFocus={index === 0}
                              />
                            </div>
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
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <Terminal className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm sm:text-base font-semibold">Output Console</CardTitle>
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
