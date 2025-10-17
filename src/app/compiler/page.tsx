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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold">Fast Execution</h3>
                <p className="text-sm text-muted-foreground">Instant compilation</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Secure Sandbox</h3>
                <p className="text-sm text-muted-foreground">Isolated environment</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Cpu className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Multiple Languages</h3>
                <p className="text-sm text-muted-foreground">6+ languages supported</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Editor */}
        <CodeEditor />
      </div>
    </div>
  );
}
