'use client';
import React, { createContext, useContext, useState } from 'react';

export interface DsaProblemsCache {
  allProblems: any[];
  setAllProblems: (problems: any[]) => void;
  userProgress: Map<number, any>;
  setUserProgress: (progress: Map<number, any>) => void;
}

const DsaProblemsCacheContext = createContext<DsaProblemsCache | null>(null);

export function DsaProblemsCacheProvider({ children }: { children: React.ReactNode }) {
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, any>>(new Map());

  return (
    <DsaProblemsCacheContext.Provider value={{ allProblems, setAllProblems, userProgress, setUserProgress }}>
      {children}
    </DsaProblemsCacheContext.Provider>
  );
}

export function useDsaProblemsCache() {
  const ctx = useContext(DsaProblemsCacheContext);
  if (!ctx) throw new Error('useDsaProblemsCache must be used within DsaProblemsCacheProvider');
  return ctx;
}

