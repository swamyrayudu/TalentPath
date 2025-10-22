// src/components/context/AdminProblemsCacheContext.tsx
"use client";
import React, { createContext, useContext, useState } from 'react';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  createdAt: Date;
}

export interface AdminProblemsCache {
  allProblems: Problem[];
  setAllProblems: (problems: Problem[]) => void;
}
const AdminProblemsCacheContext = createContext<AdminProblemsCache | null>(null);

export function AdminProblemsCacheProvider({ children }: { children: React.ReactNode }) {
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  return (
    <AdminProblemsCacheContext.Provider value={{ allProblems, setAllProblems }}>
      {children}
    </AdminProblemsCacheContext.Provider>
  );
}
export function useAdminProblemsCache() {
  const ctx = useContext(AdminProblemsCacheContext);
  if (!ctx) throw new Error('useAdminProblemsCache must be used within AdminProblemsCacheProvider');
  return ctx;
}
