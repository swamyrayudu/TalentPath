'use client';
import React, { createContext, useContext, useState } from 'react';

export interface DsaProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  createdAt: Date;
}

export interface DsaProblemsCache {
  allProblems: DsaProblem[];
  setAllProblems: React.Dispatch<React.SetStateAction<DsaProblem[]>>;
  userProgress: Map<number, boolean>;
  setUserProgress: React.Dispatch<React.SetStateAction<Map<number, boolean>>>;
}

const DsaProblemsCacheContext = createContext<DsaProblemsCache | null>(null);

export function DsaProblemsCacheProvider({ children }: { children: React.ReactNode }) {
  const [allProblems, setAllProblems] = useState<DsaProblem[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, boolean>>(new Map());

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

