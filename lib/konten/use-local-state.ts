"use client";

/**
 * Small localStorage-backed state hook shared by all M3 pages.
 * SSR-safe: renders the fallback first, hydrates after mount, persists on set.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalState<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrasi localStorage harus terjadi setelah mount agar sama dengan snapshot SSR
        setValue(parsed);
      }
    } catch {
      // corrupt data: keep fallback
    }
    loadedRef.current = true;
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore quota errors
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
