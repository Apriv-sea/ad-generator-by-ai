
import { useMemo } from 'react';
import { ZodError } from 'zod';
import { ClientSchema, CampaignSchema } from '@/schemas/validation';

export function useDataValidation() {
  const validateClient = useMemo(() => (data: unknown) => {
    try {
      return { success: true, data: ClientSchema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, data: null, error: error.issues[0]?.message || 'Erreur de validation' };
      }
      return { success: false, data: null, error: 'Erreur de validation inconnue' };
    }
  }, []);

  const validateCampaign = useMemo(() => (data: unknown) => {
    try {
      return { success: true, data: CampaignSchema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, data: null, error: error.issues[0]?.message || 'Erreur de validation' };
      }
      return { success: false, data: null, error: 'Erreur de validation inconnue' };
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
