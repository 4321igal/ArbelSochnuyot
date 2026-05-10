import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'arbel:favorites';

interface FavoritesContextType {
  favoriteIds: string[];
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage errors
    }
  }, [favoriteIds]);

  const add = useCallback((id: string) => {
    setFavoriteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setFavoriteIds((prev) => prev.filter((v) => v !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }, []);

  const has = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const value = useMemo<FavoritesContextType>(
    () => ({ favoriteIds, toggle, add, remove, has }),
    [favoriteIds, toggle, add, remove, has],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
