
import { useState, useCallback, useMemo } from 'react';
import { useDebouncedCallback } from './useMemoizedCallback';

/**
 * Hook pour optimiser les état avec de nombreuses mises à jour
 */
export function useOptimizedState<T>(
  initialValue: T,
  updateDelay: number = 300
) {
  const [value, setValue] = useState<T>(initialValue);
  const [draftValue, setDraftValue] = useState<T>(initialValue);

  const debouncedSetValue = useDebouncedCallback(setValue, updateDelay);

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(draftValue)
      : newValue;
    
    setDraftValue(resolvedValue);
    debouncedSetValue(resolvedValue);
  }, [draftValue, debouncedSetValue]);

  const commitValue = useCallback(() => {
    setValue(draftValue);
  }, [draftValue]);

  return {
    value,
    draftValue,
    updateValue,
    commitValue,
    isDirty: useMemo(() => JSON.stringify(value) !== JSON.stringify(draftValue), [value, draftValue])
  };
}

/**
 * Hook pour gérer les listes avec optimisations
 */
export function useOptimizedList<T>(
  initialItems: T[] = [],
  keySelector: (item: T) => string | number
) {
  const [items, setItems] = useState<T[]>(initialItems);

  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((key: string | number) => {
    setItems(prev => prev.filter(item => keySelector(item) !== key));
  }, [keySelector]);

  const updateItem = useCallback((key: string | number, updates: Partial<T>) => {
    setItems(prev => prev.map(item => 
      keySelector(item) === key ? { ...item, ...updates } : item
    ));
  }, [keySelector]);

  const itemsMap = useMemo(() => {
    return new Map(items.map(item => [keySelector(item), item]));
  }, [items, keySelector]);

  const getItem = useCallback((key: string | number) => {
    return itemsMap.get(key);
  }, [itemsMap]);

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    getItem,
    itemsMap
  };
}
