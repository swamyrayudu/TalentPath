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
  Code2 
} from 'lucide-react';
import { toast } from 'sonner';
import { LANGUAGE_SNIPPETS } from './snippets';

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
      toast.info(`Please provide ${prompts.length} input(s)`);
    }
  };

  const handleSubmitInputs = () => {
    if (!allInputsFilled) {
      toast.error('Please fill all input fields!');
      return;
    }

    setShowInputModal(false);
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
    
    registerSnippets();
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunClick();
    });
  };

  const currentLang = LANGUAGES.find(l => l.value === language);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>Code Editor</CardTitle>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[200px]">
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
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant={suggestionsEnabled ? "default" : "outline"} 
                size="sm" 
                onClick={toggleSuggestions}
                title="Toggle IntelliSense (Autocomplete)"
              >
                {suggestionsEnabled ? (
                  <Lightbulb className="h-4 w-4 mr-2" />
                ) : (
                  <LightbulbOff className="h-4 w-4 mr-2" />
                )}
                IntelliSense
              </Button>
              <Button 
                variant={snippetsEnabled ? "default" : "outline"} 
                size="sm" 
                onClick={toggleSnippets}
                title="Toggle Code Snippets (print, def, list, etc.)"
              >
                {snippetsEnabled ? (
                  <Code2 className="h-4 w-4 mr-2" />
                ) : (
                  <Code2 className="h-4 w-4 mr-2 opacity-50" />
                )}
                Snippets
              </Button>
              <Button variant="outline" size="sm" onClick={copyCode}>
                {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={resetCode}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleRunClick} disabled={isRunning}>
                {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Run
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={currentLang?.iconUrl} 
                  alt={currentLang?.label}
                  className="w-5 h-5"
                />
                <CardTitle className="text-sm">{currentLang?.label} Editor</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                Ctrl+Enter • Ctrl+Space
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Editor
              height="500px"
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
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Custom Input</CardTitle>
                {prompts.length > 0 ? (
                  <Badge 
                    variant={showInputModal ? "default" : "outline"} 
                    className="gap-1"
                  >
                    {showInputModal ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {prompts.length} input{prompts.length > 1 ? 's' : ''} required
                  </Badge>
                ) : (
                  <Badge variant="outline">No inputs needed</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showInputModal && prompts.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3 font-medium">
                      📝 Please provide the following inputs:
                    </p>
                    <div 
                      className={`space-y-3 ${prompts.length > 4 ? 'max-h-[200px] overflow-y-auto pr-2' : ''}`}
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#3b82f6 transparent'
                      }}
                    >
                      {prompts.map((prompt, index) => (
                        <div key={index} className="space-y-1">
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {prompt}
                          </label>
                          <Input
                            ref={(el) => {
                              if (el) {
                                inputRefs.current[index] = el;
                              }
                            }}
                            placeholder={`Enter value for "${prompt}"`}
                            value={userInputs[index] || ''}
                            onChange={(e) => {
                              const newInputs = [...userInputs];
                              newInputs[index] = e.target.value;
                              setUserInputs(newInputs);
                            }}
                            onKeyDown={(e) => handleInputKeyDown(e, index)}
                            className="font-mono text-sm"
                            autoFocus={index === 0}
                          />
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={handleSubmitInputs} 
                      disabled={!allInputsFilled}
                      className="w-full mt-4"
                      size="sm"
                    >
                      <CornerDownLeft className="h-4 w-4 mr-2" />
                      Submit & Run
                      {allInputsFilled && <span className="ml-2 text-xs opacity-75">(Press Enter)</span>}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-green-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No user inputs required for this code
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Click <strong>Run</strong> to execute
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm h-[600px] overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {output || '// Output will appear here...'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
