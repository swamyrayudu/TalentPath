// src/components/context/AdminProblemsCacheContext.tsx
"use client";
import React, { createContext, useContext, useState } from 'react';

export interface AdminProblemsCache {
  allProblems: any[];
  setAllProblems: (problems: any[]) => void;
}
const AdminProblemsCacheContext = createContext<AdminProblemsCache | null>(null);

export function AdminProblemsCacheProvider({ children }: { children: React.ReactNode }) {
  const [allProblems, setAllProblems] = useState<any[]>([]);
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
