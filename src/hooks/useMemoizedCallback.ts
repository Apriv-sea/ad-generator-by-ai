
import { useCallback, useMemo, useRef } from 'react';

/**
 * Hook pour mémoriser des callbacks coûteux avec dépendances complexes
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  const memoizedCallback = useCallback(callback, deps);
  return memoizedCallback;
}

/**
 * Hook pour mémoriser des calculs coûteux avec cache persistant
 */
export function useMemoizedComputation<T>(
  computeFn: () => T,
  deps: any[],
  cacheKey?: string
): T {
  const cacheRef = useRef<Map<string, { value: T; deps: any[] }>>(new Map());

  return useMemo(() => {
    const key = cacheKey || JSON.stringify(deps);
    const cached = cacheRef.current.get(key);

    // Vérifier si le cache est encore valide
    if (cached && JSON.stringify(cached.deps) === JSON.stringify(deps)) {
      return cached.value;
    }

    // Calculer la nouvelle valeur
    const value = computeFn();
    
    // Sauvegarder dans le cache
    cacheRef.current.set(key, { value, deps: [...deps] });
    
    // Nettoyer le cache si il devient trop grand
    if (cacheRef.current.size > 50) {
      const entries = Array.from(cacheRef.current.entries());
      cacheRef.current.clear();
      // Garder seulement les 25 plus récents
      entries.slice(-25).forEach(([k, v]) => {
        cacheRef.current.set(k, v);
      });
    }

    return value;
  }, deps);
}

/**
 * Hook pour débouncer les appels de fonction
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}
