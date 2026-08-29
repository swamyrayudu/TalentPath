'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type SheetStatus = 'solved' | 'attempted';
export type SheetProgressMap = Record<string, SheetStatus>;

const STORAGE_KEY = 'talentpath:sheet-progress';

/**
 * Curated-sheet progress lives in the browser: `user_progress.problem_id` is a
 * foreign key into our own `problems` table, and sheet problems are external
 * (LeetCode etc.), so they have no row to point at. Everything reads and writes
 * through this one store, so moving it server-side later is a change in one file.
 */
let cache: SheetProgressMap = {};
let cacheRaw: string | null = null;
let loaded = false;

const listeners = new Set<() => void>();

function read(): SheetProgressMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cacheRaw && loaded) return cache;
    cacheRaw = raw;
    loaded = true;
    cache = raw ? (JSON.parse(raw) as SheetProgressMap) : {};
  } catch {
    cache = {};
  }

  return cache;
}

function write(next: SheetProgressMap) {
  cache = next;
  try {
    cacheRaw = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, cacheRaw);
  } catch {
    // Private mode or a full quota — keep the in-memory value for this session.
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  // Another tab writing the same key should update this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      loaded = false;
      read();
      fn();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

const EMPTY: SheetProgressMap = {};

export function useSheetProgress() {
  const progress = useSyncExternalStore(subscribe, read, () => EMPTY);

  /**
   * Curated sheets show a solved count and nothing else, so the row is a plain
   * checkbox: on or off. A tri-state cycle would make the first click look like
   * a no-op, since "attempted" is never displayed anywhere on these pages.
   */
  const toggleSolved = useCallback((key: string) => {
    const next = { ...read() };

    if (next[key] === 'solved') delete next[key];
    else next[key] = 'solved';

    write(next);
  }, []);

  const setStatus = useCallback((key: string, status: SheetStatus | null) => {
    const next = { ...read() };
    if (status) next[key] = status;
    else delete next[key];
    write(next);
  }, []);

  const reset = useCallback((prefix: string) => {
    const next = { ...read() };
    Object.keys(next).forEach((k) => {
      if (k.startsWith(prefix)) delete next[k];
    });
    write(next);
  }, []);

  return { progress, toggleSolved, setStatus, reset };
}
