
import { useCallback, useEffect, useRef } from 'react';

interface AutoSaveOptions {
  delay?: number;
  onSave: (data: any) => Promise<void>;
  enabled?: boolean;
}

export function useAutoSave<T>(data: T, options: AutoSaveOptions) {
  const { delay = 2000, onSave, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  const saveData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      await onSave(data);
      previousDataRef.current = data;
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    // Ne pas sauvegarder si les données n'ont pas changé
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Effacer le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde
    timeoutRef.current = setTimeout(saveData, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, saveData]);

  // Sauvegarder immédiatement
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return saveData();
  }, [saveData]);

  return { saveNow };
}

// Service pour la compression locale
export class LocalStorageCompressionService {
  private static readonly COMPRESSION_THRESHOLD = 1024; // 1KB

  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      
      if (serialized.length > this.COMPRESSION_THRESHOLD) {
        // Compression simple pour les gros objets
        const compressed = this.compress(serialized);
        localStorage.setItem(key, JSON.stringify({
          compressed: true,
          data: compressed,
          originalSize: serialized.length
        }));
      } else {
        localStorage.setItem(key, serialized);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      if (parsed?.compressed) {
        const decompressed = this.decompress(parsed.data);
        return JSON.parse(decompressed);
      }
      
      return parsed;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  private static compress(str: string): string {
    // Compression simple - peut être remplacée par une vraie lib de compression
    return btoa(encodeURIComponent(str));
  }

  private static decompress(str: string): string {
    return decodeURIComponent(atob(str));
  }
}
