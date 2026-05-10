import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'arbel:compare';
export const COMPARE_MAX = 3;

interface CompareContextType {
  vehicleIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [vehicleIds, setVehicleIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, COMPARE_MAX) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicleIds));
    } catch {
      // Ignore storage errors
    }
  }, [vehicleIds]);

  const add = useCallback((id: string) => {
    setVehicleIds((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length >= COMPARE_MAX) return prev;
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setVehicleIds((prev) => prev.filter((v) => v !== id));
  }, []);

  const clear = useCallback(() => setVehicleIds([]), []);
  const has = useCallback((id: string) => vehicleIds.includes(id), [vehicleIds]);

  const value = useMemo<CompareContextType>(
    () => ({ vehicleIds, add, remove, clear, has, isFull: vehicleIds.length >= COMPARE_MAX }),
    [vehicleIds, add, remove, clear, has],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextType {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
