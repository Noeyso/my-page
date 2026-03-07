import { useState } from 'react';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  parse: (raw: string) => T = (raw) => JSON.parse(raw),
  serialize: (value: T) => string = (value) => JSON.stringify(value),
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        localStorage.setItem(key, serialize(next));
      } catch { /* silently fail */ }
      return next;
    });
  };

  return [state, setAndPersist];
}
