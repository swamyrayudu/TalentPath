'use client';

import { CodeEditor } from '@/components/compiler/code-editor';
import { Card, CardContent } from '@/components/ui/card';
import { Code2, Zap, Shield, Cpu } from 'lucide-react';

export default function Compiler() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Code2 className="h-10 w-10 text-primary" />
            Online Code Compiler
          </h1>
          <p className="text-muted-foreground text-lg">
            Write, compile, and run code in multiple programming languages
          </p>
        </div>

        {/* Features */}


        {/* Code Editor */}
        <CodeEditor />
      </div>
    </div>
  );
}
