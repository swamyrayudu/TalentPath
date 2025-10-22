'use client';
import React from 'react'
import { CodeEditor } from '@/components/compiler/code-editor';


export default function Compiler() {
  return (
    <div className="min-h-screen bg-background">
      <CodeEditor />
    </div>
  );
}
