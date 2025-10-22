// lib/hooks/useIntersectionObserver.ts
'use client';

import { useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  enabled: boolean;
}

export function useIntersectionObserver({ 
  onIntersect, 
  enabled 
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) {return;}

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Load 100px before reaching bottom
      }
    );

    observer.observe(targetRef.current);

    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return targetRef;
}