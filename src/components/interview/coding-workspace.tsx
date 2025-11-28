"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Terminal, Keyboard } from "lucide-react";
import { useCodeEditor } from "@/components/compiler/useCodeEditor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl bg-zinc-900 text-xs text-zinc-400">
      Initializing coding workspace...
    </div>
  ),
});

interface CodingWorkspaceProps {
  className?: string;
}

export default function CodingWorkspace({ className }: CodingWorkspaceProps) {
  const {
    language,
    code,
    userInputs,
    output,
    isRunning,
    prompts,
    allInputsFilled,
    currentLang,
    showInputModal,
    inputRefs,
    handleLanguageChange,
    handleCodeChange,
    handleRunClick,
    handleSubmitInputs,
    handleInputKeyDown,
    handleInputChange,
    handleEditorDidMount,
    editorOptions,
    LANGUAGES,
  } = useCodeEditor();

  const shouldShowInputs = showInputModal && prompts.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              Live Coding Workspace
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Compile and run code during the interview without leaving the call.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRunClick} disabled={isRunning} className="min-w-[120px]">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Run Code
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border bg-zinc-950">
              <MonacoEditor
                height="380px"
                language={currentLang?.monacoLang || "python"}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  ...editorOptions,
                  minimap: { enabled: false },
                  fontSize: 13,
                }}
              />
            </div>

            {shouldShowInputs && (
              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Keyboard className="h-4 w-4 text-primary" />
                  Provide inputs before running
                </div>
                <div className="space-y-3">
                  {prompts.map((prompt, index) => (
                    <div key={prompt + index}>
                      <label className="text-xs font-medium text-muted-foreground">{prompt}</label>
                      <Input
                        ref={(el) => {
                          if (el) {
                            inputRefs.current[index] = el;
                          }
                        }}
                        value={userInputs[index] || ""}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, index)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={handleSubmitInputs}
                  disabled={!allInputsFilled}
                >
                  Submit Inputs & Execute
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Terminal className="h-4 w-4 text-green-500" /> Output Console
              </div>
              <Badge variant="outline" className="text-xs">
                {isRunning ? "Running" : "Idle"}
              </Badge>
            </div>
            <div className="h-[380px] overflow-auto bg-black p-4 font-mono text-xs text-green-100">
              <pre className="whitespace-pre-wrap">
                {output || "// Run your code to see the output here"}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

