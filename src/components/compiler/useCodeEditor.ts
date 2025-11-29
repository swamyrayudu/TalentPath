'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { LANGUAGE_SNIPPETS } from './snippets';
import { registerCompletionProviders } from './intellisense';
import type * as Monaco from 'monaco-editor';

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
  python: `print("TalentPath")
print("Developed by: Swamy Rayudu & Siva Durga Prasad")`,
  
  javascript: `console.log("TalentPath");
console.log("Developed by: Swamy Rayudu & Siva Durga Prasad");`,
  
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("TalentPath");
        System.out.println("Developed by: Swamy Rayudu & Siva Durga Prasad");
    }
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "TalentPath" << endl;
    cout << "Developed by: Swamy Rayudu & Siva Durga Prasad" << endl;
    return 0;
}`,

  c: `#include <stdio.h>

int main() {
    printf("TalentPath\\n");
    printf("Developed by: Swamy Rayudu & Siva Durga Prasad\\n");
    return 0;
}`,

  go: `package main

import "fmt"

func main() {
    fmt.Println("TalentPath")
    fmt.Println("Developed by: Swamy Rayudu & Siva Durga Prasad")
}`,
};

function extractPrompts(code: string, language: string): string[] {
  try {
    const prompts: string[] = [];
    
    if (language === 'python') {
      // Remove all comments from code before extracting input() calls
      const codeWithoutComments = code
        .split('\n')
        .map(line => {
          const commentIndex = line.indexOf('#');
          return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        })
        .join('\n');
      
      // Match only input() function calls, not print() or other functions
      const inputRegex = /\binput\s*\(\s*(?:["']([^"']*)["'])?\s*\)/g;
      
      let match;
      let inputCount = 0;
      
      while ((match = inputRegex.exec(codeWithoutComments)) !== null) {
        inputCount++;
        // Use the prompt text if available, otherwise use generic label
        const promptText = match[1] && match[1].trim() ? match[1].trim() : `Input ${inputCount}`;
        prompts.push(promptText);
      }
      
    } else if (language === 'java') {
      const scannerRegex = /sc\.next(?:Line|Int|Double|Float|Boolean)\s*\(\s*\)/g;
      let match;
      let inputCount = 0;
      
      while ((match = scannerRegex.exec(code)) !== null) {
        inputCount++;
        prompts.push(`Input ${inputCount}`);
      }
      
      const printRegex = /System\.out\.print\s*\(\s*"([^"]*)"\s*\)/g;
      const printMatches: string[] = [];
      while ((match = printRegex.exec(code)) !== null) {
        if (match[1].trim()) printMatches.push(match[1]);
      }
      
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

export function useCodeEditor() {
  // Initialize with session storage or default
  const getInitialLanguage = () => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('compiler-language');
      return saved || 'python';
    }
    return 'python';
  };

  const getInitialCode = () => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('compiler-code');
      if (saved) return saved;
    }
    return DEFAULT_CODE.python;
  };

  const [language, setLanguage] = useState(getInitialLanguage());
  const [code, setCode] = useState(getInitialCode());
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [snippetsEnabled, setSnippetsEnabled] = useState(true);
  const [showInputModal, setShowInputModal] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  // Terminal-style input handling
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [currentInputIndex, setCurrentInputIndex] = useState(0);
  const [terminalInput, setTerminalInput] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const completionProviderRef = useRef<Monaco.IDisposable | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced throttling refs with multiple tracking mechanisms
  const lastKeyPressRef = useRef<number>(0);
  const keyHoldTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const enterPressCountRef = useRef<number>(0);
  const lastRunTimeRef = useRef<number>(0);

  // Auto-save code and language to session storage
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('compiler-code', code);
        sessionStorage.setItem('compiler-language', language);
      }
    }, 500); // Debounce save by 500ms

    return () => clearTimeout(saveTimer);
  }, [code, language]);

  // Stable prompts extraction with proper memoization
  const prompts = useMemo(() => {
    try {
      return extractPrompts(code, language);
    } catch {
      return [];
    }
  }, [code, language]);

  useEffect(() => {
    setUserInputs(new Array(prompts.length).fill(''));
    inputRefs.current = new Array(prompts.length).fill(null);
  }, [prompts.length]);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (keyHoldTimeoutRef.current) {
        clearTimeout(keyHoldTimeoutRef.current);
      }
    };
  }, []);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    const newCode = DEFAULT_CODE[newLanguage] || '';
    setCode(newCode);
    setUserInputs([]);
    setOutput('');
    setShowInputModal(false);
    // Save to session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('compiler-language', newLanguage);
      sessionStorage.setItem('compiler-code', newCode);
    }
  }, []);

  // Optimized code change handler with improved debouncing
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    const changeSize = Math.abs(value.length - code.length);
    
    // Use requestAnimationFrame for smoother updates
    if (changeSize < 3) {
      // Very small change, update immediately
      requestAnimationFrame(() => setCode(value));
    } else if (changeSize < 10) {
      // Small-medium change, minimal debounce
      debounceTimerRef.current = setTimeout(() => {
        setCode(value);
      }, 30);
    } else {
      // Large change (paste), longer debounce
      debounceTimerRef.current = setTimeout(() => {
        setCode(value);
      }, 100);
    }
  }, [code.length]);

  const toggleSuggestions = useCallback(() => {
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
  }, [suggestionsEnabled]);

  const toggleSnippets = useCallback(() => {
    const newValue = !snippetsEnabled;
    setSnippetsEnabled(newValue);
    
    if (editorRef.current && monacoRef.current) {
      if (newValue) {
        registerSnippets();
        toast.success('Code Snippets enabled');
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
  }, [snippetsEnabled]);

  const allInputsFilled = useMemo(() => {
    if (prompts.length === 0) return true;
    return userInputs.every(input => input.trim() !== '');
  }, [userInputs, prompts]);

  const handleRunClick = useCallback(() => {
    const now = Date.now();
    if (now - lastRunTimeRef.current < 1000) {
      return;
    }
    lastRunTimeRef.current = now;

    if (!code.trim()) {
      toast.error('Please write some code first!');
      return;
    }

    // Switch to output tab and clear terminal
    setActiveTab('output');
    setTerminalOutput(['$ Executing code...\n']);
    setUserInputs([]);
    setCurrentInputIndex(0);
    setTerminalInput('');
    
    if (prompts.length === 0) {
      executeCode([]);
    } else {
      // Show first input prompt in terminal (don't add extra colon if prompt already ends with punctuation)
      const firstPrompt = prompts[0];
      const needsColon = !firstPrompt.match(/[:\s?!]$/);
      setTerminalOutput([`$ Executing code...\n\n${firstPrompt}${needsColon ? ': ' : ''}`]);
      setWaitingForInput(true);
    }
  }, [code, prompts]);

  const handleTerminalInputSubmit = useCallback(() => {
    if (!terminalInput.trim() || !waitingForInput) return;
    
    const newInputs = [...userInputs, terminalInput];
    setUserInputs(newInputs);
    
    // Add input to terminal output
    setTerminalOutput(prev => [...prev, terminalInput + '\n']);
    
    if (currentInputIndex < prompts.length - 1) {
      // Show next prompt (don't add extra colon if prompt already ends with punctuation)
      const nextIndex = currentInputIndex + 1;
      setCurrentInputIndex(nextIndex);
      const nextPrompt = prompts[nextIndex];
      const needsColon = !nextPrompt.match(/[:\s?!]$/);
      setTerminalOutput(prev => [...prev, `${nextPrompt}${needsColon ? ': ' : ''}`]);
      setTerminalInput('');
    } else {
      // All inputs collected, execute
      setWaitingForInput(false);
      setTerminalOutput(prev => [...prev, '\n━━━ Compiling & Running ━━━\n\n']);
      setTerminalInput('');
      executeCode(newInputs);
    }
  }, [terminalInput, waitingForInput, currentInputIndex, prompts, userInputs]);

  const handleSubmitInputs = useCallback(() => {
    if (isProcessingRef.current) {
      return;
    }

    if (!allInputsFilled) {
      toast.error('Please fill all input fields!');
      return;
    }

    isProcessingRef.current = true;
    setShowInputModal(false);
    setActiveTab('output');
    executeCode(userInputs);
    
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  }, [allInputsFilled, userInputs]);

  // Enhanced input key handler with comprehensive throttling
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      const now = Date.now();
      
      // Multi-level throttling protection
      // 1. Basic time-based throttling (500ms minimum)
      if (now - lastKeyPressRef.current < 500) {
        return;
      }
      
      // 2. Prevent if already processing
      if (isProcessingRef.current) {
        return;
      }
      
      // 3. Track rapid Enter key presses
      if (now - lastKeyPressRef.current < 1000) {
        enterPressCountRef.current++;
        if (enterPressCountRef.current > 2) {
          // More than 2 Enter presses within 1 second
          toast.warning('Please wait before submitting again');
          return;
        }
      } else {
        // Reset counter if more than 1 second has passed
        enterPressCountRef.current = 1;
      }
      
      lastKeyPressRef.current = now;
      
      // Clear any pending key hold timeout
      if (keyHoldTimeoutRef.current) {
        clearTimeout(keyHoldTimeoutRef.current);
      }
      
      // Handle navigation or submission
      if (index === prompts.length - 1 && allInputsFilled) {
        handleSubmitInputs();
      } else if (index < prompts.length - 1) {
        const nextIndex = index + 1;
        if (inputRefs.current[nextIndex]) {
          requestAnimationFrame(() => {
            inputRefs.current[nextIndex]?.focus();
          });
        }
      }
    }
  }, [prompts.length, allInputsFilled, handleSubmitInputs]);

  // Optimized input change handler
  const handleInputChange = useCallback((index: number, value: string) => {
    setUserInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  }, []);

  const executeCode = async (inputs: string[]) => {
    const stdin = inputs.join('\n');

    setIsRunning(true);
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

      // Debug logging
      console.log('Frontend received result:', {
        success: result.success,
        hasOutput: !!result.output,
        outputLength: result.output?.length || 0,
        debug: result.debug,
      });

      if (result.timeout) {
        setTerminalOutput(prev => [...prev, '\n❌ Timeout Error\n', result.stderr]);
        setIsRunning(false);
        return;
      }

      if (result.limitExceeded) {
        const displayOutput = result.output ? result.output + '\n\n' + result.stderr : result.stderr;
        setTerminalOutput(prev => [...prev, '\n⚠️  Output Limit Exceeded\n', displayOutput]);
        setIsRunning(false);
        return;
      }

      if (result.success) {
        const rawOutput = result.output || '';
        
        if (rawOutput && rawOutput.trim()) {
          setTerminalOutput(prev => [...prev, rawOutput, '\n\n✅ Process exited with code 0\n']);
        } else {
          setTerminalOutput(prev => [...prev, '\n✅ Code executed successfully (no output)\n']);
        }
        
        if (prompts.length > 0) {
          setUserInputs(new Array(prompts.length).fill(''));
        }
      } else {
        const errorOutput = result.stderr || result.output || result.error || 'Execution failed. Please check your code.';
        setTerminalOutput(prev => [...prev, '\n❌ Execution Failed\n\n', errorOutput, '\n']);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTerminalOutput(prev => [...prev, `\n❌ Network Error\n\n${errorMessage}\n`]);
    } finally {
      setIsRunning(false);
      isProcessingRef.current = false;
    }
  };

  const registerSnippets = useCallback(() => {
    if (!monacoRef.current) return;
    
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }
    
    Object.keys(LANGUAGE_SNIPPETS).forEach((lang) => {
      const monacoLang = LANGUAGES.find(l => l.value === lang)?.monacoLang || lang;
      
      if (!monacoRef.current) return;
      
      const provider = monacoRef.current.languages.registerCompletionItemProvider(monacoLang, {
        provideCompletionItems: (model: Monaco.editor.ITextModel, position: Monaco.Position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const monaco = monacoRef.current;
          if (!monaco) return { suggestions: [] };

          const suggestions = LANGUAGE_SNIPPETS[lang].map((snippet: { label: string; insertText: string; documentation?: string }) => ({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            documentation: snippet.documentation,
            range: range,
          }));

          return { suggestions };
        },
      });
      
      completionProviderRef.current = provider;
    });
  }, []);

  const handleEditorDidMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    if (editorRef.current) return;
    
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    registerCompletionProviders(monaco);
    registerSnippets();

    // Performance optimizations
    editor.updateOptions({
      scrollbar: {
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      renderLineHighlight: 'gutter',
      occurrencesHighlight: 'off' as const,
      renderWhitespace: 'none',
      folding: false,
      // Additional performance options
      hover: {
        delay: 300,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
    });
  }, [registerSnippets, handleRunClick]);

  const currentLang = useMemo(() => LANGUAGES.find(l => l.value === language), [language]);

  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'on' as const,
    quickSuggestions: suggestionsEnabled,
    suggestOnTriggerCharacters: suggestionsEnabled,
    acceptSuggestionOnEnter: 'on' as const,
    tabCompletion: 'on' as const,
    wordBasedSuggestions: 'matchingDocuments' as const,
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
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
  }), [suggestionsEnabled, snippetsEnabled]);

  const mobileEditorOptions = useMemo(() => ({
    ...editorOptions,
    fontSize: 13,
    padding: { top: 12, bottom: 12 },
  }), [editorOptions]);

  return {
    // State
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
    terminalOutput,
    terminalInput,
    waitingForInput,
    currentInputIndex,
    
    // Refs
    inputRefs,
    
    // Handlers
    handleLanguageChange,
    handleCodeChange,
    toggleSuggestions,
    toggleSnippets,
    handleRunClick,
    handleSubmitInputs,
    handleInputKeyDown,
    handleInputChange,
    handleEditorDidMount,
    handleTerminalInputSubmit,
    setUserInputs,
    setActiveTab,
    setTerminalInput,
    
    // Options
    editorOptions,
    mobileEditorOptions,
    
    // Constants
    LANGUAGES,
  };
}
