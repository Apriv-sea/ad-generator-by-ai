
import { useMemo } from 'react';
import { z } from 'zod';

// Schémas de validation avec Zod
const ClientSchema = z.object({
  id: z.string().min(1, "L'ID client est requis"),
  name: z.string().min(1, "Le nom du client est requis"),
  businessContext: z.string().optional(),
  specifics: z.string().optional(),
  editorialGuidelines: z.string().optional(),
});

const CampaignSchema = z.object({
  name: z.string().min(1, "Le nom de la campagne est requis"),
  context: z.string(),
  adGroups: z.array(z.object({
    name: z.string().min(1, "Le nom du groupe d'annonces est requis"),
    keywords: z.array(z.string()).min(1, "Au moins un mot-clé est requis"),
    context: z.string()
  }))
});

export function useDataValidation() {
  const validateClient = useMemo(() => (data: unknown) => {
    try {
      return { success: true, data: ClientSchema.parse(data), error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }, []);

  const validateCampaign = useMemo(() => (data: unknown) => {
    try {
      return { success: true, data: CampaignSchema.parse(data), error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }, []);

  const validateSheetData = useMemo(() => (data: any[][]) => {
    if (!Array.isArray(data)) {
      return { success: false, error: "Les données doivent être un tableau" };
    }
    
    if (data.length === 0) {
      return { success: false, error: "Les données ne peuvent pas être vides" };
    }

    return { success: true, error: null };
  }, []);

  return {
    validateClient,
    validateCampaign,
    validateSheetData,
    schemas: {
      ClientSchema,
      CampaignSchema
    }
  };
}
