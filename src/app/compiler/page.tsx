'use client';
import React from 'react'
import { CodeEditor } from '@/components/compiler/code-editor';


export default function Compiler() {
  return (
    <div className="h-[calc(100vh-65px)] w-full overflow-hidden bg-background">
      <CodeEditor />
    </div>
  );
}
