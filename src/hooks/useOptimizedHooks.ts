import { useCallback, useMemo } from 'react';

/**
 * Hook pour créer des callbacks mémorisés avec dépendances optimisées
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Hook pour créer des valeurs mémorisées avec dépendances optimisées
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Hook pour mémoriser des objets stables
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}

/**
 * Hook pour mémoriser des tableaux stables
 */
export function useStableArray<T>(arr: T[]): T[] {
  return useMemo(() => arr, arr);
}