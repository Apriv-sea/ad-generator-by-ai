
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContentMetrics {
  titleLengths: number[];
  descriptionLengths: number[];
  averageTitleLength: number;
  averageDescriptionLength: number;
}

export const validateContent = (titles: string[], descriptions: string[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validation des titres
  titles.forEach((title, index) => {
    if (!title || title.trim().length === 0) {
      errors.push(`Titre ${index + 1} est vide`);
    } else if (title.length > 60) {
      warnings.push(`Titre ${index + 1} dépasse 60 caractères`);
    }
  });

  // Validation des descriptions
  descriptions.forEach((description, index) => {
    if (!description || description.trim().length === 0) {
      errors.push(`Description ${index + 1} est vide`);
    } else if (description.length > 160) {
      warnings.push(`Description ${index + 1} dépasse 160 caractères`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const calculateContentMetrics = (titles: string[], descriptions: string[]): ContentMetrics => {
  const titleLengths = titles.map(title => title.length);
  const descriptionLengths = descriptions.map(desc => desc.length);

  return {
    titleLengths,
    descriptionLengths,
    averageTitleLength: titleLengths.reduce((sum, len) => sum + len, 0) / titleLengths.length || 0,
    averageDescriptionLength: descriptionLengths.reduce((sum, len) => sum + len, 0) / descriptionLengths.length || 0
  };
};

export const cleanupContent = (content: string[]): string[] => {
  return content
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      // Supprimer les guillemets en début/fin
      if ((item.startsWith('"') && item.endsWith('"')) || 
          (item.startsWith("'") && item.endsWith("'"))) {
        return item.slice(1, -1);
      }
      return item;
    });
};

export const createBackupData = async (sheetId: string, content: any[][]): Promise<string | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase.functions.invoke('create_automatic_backup', {
      body: {
        backup_type: 'sheet_data',
        data_reference: sheetId,
        backup_data: content
      }
    });

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error);
    return null;
  }
};
