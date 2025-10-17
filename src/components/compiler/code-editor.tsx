'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Copy, RotateCcw, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍', monacoLang: 'python' },
  { value: 'javascript', label: 'JavaScript', icon: '⚡', monacoLang: 'javascript' },
  { value: 'java', label: 'Java', icon: '☕', monacoLang: 'java' },
  { value: 'cpp', label: 'C++', icon: '⚙️', monacoLang: 'cpp' },
  { value: 'c', label: 'C', icon: '🔧', monacoLang: 'c' },
  { value: 'go', label: 'Go', icon: '🐹', monacoLang: 'go' },
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompts = useMemo(() => extractPrompts(code, language), [code, language]);

  useEffect(() => {
    setUserInputs(prev => {
      if (prompts.length === 0) return [];
      const newInputs = [...prev];
      while (newInputs.length < prompts.length) {
        newInputs.push('');
      }
      return newInputs.slice(0, prompts.length);
    });
  }, [prompts]);

  function extractPrompts(code: string, language: string): string[] {
    try {
      const prompts: string[] = [];
      
      if (language === 'python') {
        const regex = /input\s*\(\s*["']([^"']*)["']\s*\)/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
          prompts.push(match[1]);
        }
      } else if (language === 'java') {
        const regex = /System\.out\.print\s*\(\s*"([^"]*)"\s*\)/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
          if (match[1].trim()) prompts.push(match[1]);
        }
      } else if (language === 'cpp' || language === 'c') {
        const coutRegex = /cout\s*<<\s*"([^"]*)"/g;
        const printfRegex = /printf\s*\(\s*"([^"]*)"/g;
        let match;
        
        while ((match = coutRegex.exec(code)) !== null) {
          if (match[1].trim()) prompts.push(match[1]);
        }
        
        while ((match = printfRegex.exec(code)) !== null) {
          if (match[1].trim() && !match[1].includes('%')) prompts.push(match[1]);
        }
      } else if (language === 'go') {
        const regex = /fmt\.Print\s*\(\s*"([^"]*)"\s*\)/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
          if (match[1].trim()) prompts.push(match[1]);
        }
      }
      
      return prompts;
    } catch {
      return [];
    }
  }

  const customInputDisplay = useMemo(() => {
    return prompts.map((prompt, index) => {
      const userInput = userInputs[index] || '';
      return `${prompt}${userInput}`;
    }).join('\n');
  }, [prompts, userInputs]);

  // Check if all inputs are filled
  const allInputsFilled = useMemo(() => {
    return userInputs.every((input, index) => index >= prompts.length || input.trim() !== '');
  }, [userInputs, prompts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const lines = value.split('\n');
    
    // Don't allow more lines than prompts
    if (lines.length > prompts.length) {
      toast.error(`Only ${prompts.length} input(s) required. Extra inputs not allowed.`, {
        description: 'Remove extra lines to continue',
      });
      return;
    }
    
    const newUserInputs = lines.map((line, index) => {
      if (index >= prompts.length) return '';
      const prompt = prompts[index];
      if (line.startsWith(prompt)) {
        return line.substring(prompt.length);
      }
      return '';
    });
    
    setUserInputs(newUserInputs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const value = textarea.value;
    const lines = value.split('\n');

    // Prevent Enter key if all inputs are filled
    if (e.key === 'Enter') {
      // Check if we're at the last line
      const currentLineIndex = value.substring(0, cursorPos).split('\n').length - 1;
      
      if (currentLineIndex >= prompts.length - 1) {
        // Check if current line has input
        const currentLine = lines[currentLineIndex] || '';
        const currentPrompt = prompts[currentLineIndex] || '';
        const hasInput = currentLine.length > currentPrompt.length;
        
        if (hasInput && lines.length >= prompts.length) {
          e.preventDefault();
          toast.warning(`Only ${prompts.length} input(s) allowed. Enter key disabled.`, {
            description: 'All required inputs provided',
          });
          return;
        }
      }
    }

    // Find current line
    let currentLineIndex = 0;
    let charsBeforeLine = 0;

    for (let i = 0; i < lines.length; i++) {
      if (cursorPos <= charsBeforeLine + lines[i].length) {
        currentLineIndex = i;
        break;
      }
      charsBeforeLine += lines[i].length + 1;
    }

    // Prevent deleting prompts
    if (currentLineIndex < prompts.length) {
      const prompt = prompts[currentLineIndex];
      const positionInLine = cursorPos - charsBeforeLine;

      if ((e.key === 'Backspace' || e.key === 'Delete') && positionInLine < prompt.length) {
        e.preventDefault();
      }
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage] || '');
    setUserInputs([]);
    setOutput('');
  };
  const runCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first!');
      return;
    }
  
    const emptyInputs = userInputs.filter((input, index) => index < prompts.length && !input.trim());
    if (emptyInputs.length > 0) {
      toast.error(`Please provide all ${prompts.length} input(s) before running`);
      return;
    }
  
    const stdinLines = userInputs
      .map(input => input.trim())
      .filter((input, index) => index < prompts.length);
    
    const stdin = stdinLines.join('\n');
  
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
  
      if (result.success) {
        let rawOutput = result.output || '';
        
        // Remove prompts and inputs from output more aggressively
        let cleanedOutput = rawOutput;
        
        // Remove each prompt with or without trailing space
        prompts.forEach(prompt => {
          const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          cleanedOutput = cleanedOutput.replace(new RegExp(escapedPrompt + '\\s*', 'g'), '');
        });
        
        // Remove input values that appear alone on lines
        stdinLines.forEach(input => {
          if (input) {
            const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            cleanedOutput = cleanedOutput.replace(new RegExp('^' + escapedInput + '$', 'gm'), '');
          }
        });
        
        // Clean up excessive newlines and trim
        const finalOutput = cleanedOutput
          .split('\n')
          .filter(line => line.trim() !== '')
          .join('\n')
          .trim();
        
        if (finalOutput) {
          setOutput(finalOutput + '\n\n=== Code Execution Successful ===');
        } else {
          setOutput('=== Code Execution Successful ===');
        }
        
        toast.success('Executed successfully!');
        setUserInputs(new Array(prompts.length).fill(''));
      } else {
        setOutput(result.stderr || result.output || result.error || 'Unknown error');
        toast.error('Execution failed');
      }
    } catch (error: any) {
      setOutput(`Network Error: ${error.message}`);
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
    toast.success('Reset!');
  };

  const currentLang = LANGUAGES.find(l => l.value === language);
  const filledInputsCount = userInputs.filter(input => input.trim()).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>Code Editor</CardTitle>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.icon}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyCode}>
                {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={resetCode}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={runCode} disabled={isRunning}>
                {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Run
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Code Editor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Editor
              height="500px"
              language={currentLang?.monacoLang || 'python'}
              value={code}
              onChange={(value) => setCode(value || '')}
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
              }}
            />
          </CardContent>
        </Card>

        {/* Right Side */}
        <div className="space-y-4">
          {/* Input */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Custom Input</CardTitle>
                {prompts.length > 0 ? (
                  <Badge 
                    variant={allInputsFilled ? "default" : "destructive"} 
                    className="gap-1"
                  >
                    {allInputsFilled ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {filledInputsCount}/{prompts.length} inputs
                  </Badge>
                ) : (
                  <Badge variant="outline">No inputs</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textareaRef}
                placeholder={prompts.length > 0 ? "Prompts will appear here..." : "No inputs needed"}
                value={customInputDisplay}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="font-mono text-sm h-[150px] resize-none"
                disabled={prompts.length === 0}
              />
              <div className="flex items-start gap-2 mt-2">
                <span className="text-xs text-muted-foreground">💡</span>
                <div className="text-xs text-muted-foreground space-y-1">
                  {prompts.length > 0 ? (
                    <>
                      <p>Type after each prompt (prompts are protected)</p>
                      {allInputsFilled && (
                        <p className="flex items-center gap-1 text-amber-600">
                          <Lock className="h-3 w-3" />
                          Enter key disabled - All inputs provided
                        </p>
                      )}
                    </>
                  ) : (
                    <p>No user input required</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm h-[300px] overflow-auto">
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
