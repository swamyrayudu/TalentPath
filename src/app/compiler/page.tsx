'use client';

import { CodeEditor } from '@/components/compiler/code-editor';
import { Card, CardContent } from '@/components/ui/card';
import { Code2, Zap, Shield, Cpu } from 'lucide-react';

export default function Compiler() {
  return (
    <div className="min-h-screen bg-background">
      <CodeEditor />
    </div>
  );
}
