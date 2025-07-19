import { SheetData, CampaignData, AdGroupData, WorkflowData } from '@/types/strict';
import { ErrorService } from '@/services/errorService';

/**
 * Service de validation TypeScript strict
 * Type guards et validateurs pour assurer la type safety
 */
export class TypeValidationService {

  /**
   * Type guard pour SheetData
   */
  static isSheetData(data: unknown): data is SheetData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'values' in data &&
      Array.isArray((data as any).values) &&
      (data as any).values.every((row: unknown) => Array.isArray(row))
    );
  }

  /**
   * Type guard pour CampaignData
   */
  static isCampaignData(data: unknown): data is CampaignData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'name' in data &&
      'context' in data &&
      'adGroups' in data &&
      typeof (data as any).name === 'string' &&
      typeof (data as any).context === 'string' &&
      Array.isArray((data as any).adGroups)
    );
  }

  /**
   * Type guard pour AdGroupData
   */
  static isAdGroupData(data: unknown): data is AdGroupData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'name' in data &&
      'keywords' in data &&
      'context' in data &&
      typeof (data as any).name === 'string' &&
      Array.isArray((data as any).keywords) &&
      typeof (data as any).context === 'string'
    );
  }

  /**
   * Valide et convertit des données en tableau 2D strict
   */
  static validateTableData(data: unknown): { data: string[][]; error: null } | { data: null; error: string } {
    if (!Array.isArray(data)) {
      return { data: null, error: 'Les données doivent être un tableau' };
    }

    const validatedData: string[][] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row)) {
        return { data: null, error: `La ligne ${i + 1} n'est pas un tableau` };
      }

      const validatedRow: string[] = row.map((cell, j) => {
        if (typeof cell === 'string') {
          return cell;
        } else if (cell === null || cell === undefined) {
          return '';
        } else {
          return String(cell);
        }
      });

      validatedData.push(validatedRow);
    }

    return { data: validatedData, error: null };
  }

  /**
   * Valide les mots-clés d'un groupe d'annonces
   */
  static validateKeywords(keywords: unknown): { data: string[]; error: null } | { data: null; error: string } {
    if (!Array.isArray(keywords)) {
      return { data: null, error: 'Les mots-clés doivent être un tableau' };
    }

    const validKeywords: string[] = [];
    
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      if (typeof keyword === 'string' && keyword.trim().length > 0) {
        validKeywords.push(keyword.trim());
      } else {
        return { data: null, error: `Le mot-clé ${i + 1} n'est pas valide` };
      }
    }

    if (validKeywords.length === 0) {
      return { data: null, error: 'Au moins un mot-clé est requis' };
    }

    return { data: validKeywords, error: null };
  }

  /**
   * Sérialise les données de manière sûre
   */
  static safeSerialize<T>(data: T): string {
    try {
      return JSON.stringify(data, this.jsonReplacer);
    } catch (error) {
      return JSON.stringify({ 
        error: 'Serialization failed', 
        type: typeof data 
      });
    }
  }

  /**
   * Désérialise les données de manière sûre
   */
  static safeDeserialize<T>(json: string, validator: (data: unknown) => data is T): { data: T; error: null } | { data: null; error: string } {
    try {
      const parsed = JSON.parse(json);
      
      if (validator(parsed)) {
        return { data: parsed, error: null };
      } else {
        return { data: null, error: 'Les données désérialisées ne correspondent pas au type attendu' };
      }
    } catch (error) {
      return { data: null, error: 'Erreur de désérialisation JSON' };
    }
  }

  /**
   * Nettoie et valide les données utilisateur
   */
  static sanitizeUserInput(input: unknown): string {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Supprimer les balises HTML
        .replace(/javascript:/gi, '') // Supprimer javascript:
        .substring(0, 10000); // Limiter la longueur
    }
    
    if (input === null || input === undefined) {
      return '';
    }
    
    return String(input).substring(0, 10000);
  }

  /**
   * Valide un email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valide une URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fonction de remplacement pour JSON.stringify
   */
  private static jsonReplacer(key: string, value: unknown): unknown {
    // Gérer les fonctions et undefined
    if (typeof value === 'function' || value === undefined) {
      return '[Function]';
    }
    
    // Gérer les BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    // Gérer les dates
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Gérer les erreurs
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }
    
    return value;
  }

  /**
   * Crée un proxy pour surveiller les accès aux propriétés
   */
  static createSafeProxy<T extends Record<string, any>>(
    target: T,
    onAccess?: (prop: keyof T) => void
  ): T {
    return new Proxy(target, {
      get(obj, prop) {
        if (typeof prop === 'string' && prop in obj) {
          onAccess?.(prop as keyof T);
          return (obj as any)[prop];
        }
        return undefined;
      },
      set(obj, prop, value) {
        if (typeof prop === 'string') {
          (obj as any)[prop] = value;
          return true;
        }
        return false;
      }
    });
  }
}