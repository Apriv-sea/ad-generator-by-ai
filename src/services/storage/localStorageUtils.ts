
import { toast } from "sonner";

/**
 * Utility functions for working with localStorage
 */
export const localStorageUtils = {
  /**
   * Get an item from localStorage and parse it as JSON
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error retrieving item from localStorage (${key}):`, error);
      return null;
    }
  },

  /**
   * Store an item in localStorage as JSON
   */
  setItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error storing item in localStorage (${key}):`, error);
      toast.error("Impossible de sauvegarder les données localement");
      return false;
    }
  },

  /**
   * Remove an item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage (${key}):`, error);
      return false;
    }
  }
};
