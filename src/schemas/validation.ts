import { z } from 'zod';

// Schémas pour la validation des formulaires

export const ClientSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du client est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  businessContext: z.string()
    .min(10, 'Le contexte métier doit contenir au moins 10 caractères')
    .max(2000, 'Le contexte métier ne peut pas dépasser 2000 caractères'),
  specifics: z.string()
    .max(1000, 'Les spécificités ne peuvent pas dépasser 1000 caractères')
    .optional(),
  editorialGuidelines: z.string()
    .max(1000, 'Les directives éditoriales ne peuvent pas dépasser 1000 caractères')
    .optional(),
});

export const CampaignSchema = z.object({
  campaignName: z.string()
    .min(1, 'Le nom de la campagne est requis')
    .max(100, 'Le nom de la campagne ne peut pas dépasser 100 caractères'),
  adGroupName: z.string()
    .min(1, 'Le nom du groupe d\'annonces est requis')
    .max(100, 'Le nom du groupe d\'annonces ne peut pas dépasser 100 caractères'),
  keywords: z.array(z.string().min(1))
    .min(1, 'Au moins un mot-clé est requis')
    .max(20, 'Maximum 20 mots-clés autorisés'),
});

export const GenerationOptionsSchema = z.object({
  model: z.string().min(1, 'Le modèle est requis'),
  clientContext: z.string().min(1, 'Le contexte client est requis'),
  campaignContext: z.string().min(1, 'Le contexte de la campagne est requis'),
  adGroupContext: z.string().min(1, 'Le contexte du groupe d\'annonces est requis'),
  keywords: z.array(z.string()).min(1, 'Au moins un mot-clé est requis'),
});

export const ApiKeySchema = z.object({
  service: z.enum(['openai', 'anthropic', 'perplexity']),
  apiKey: z.string()
    .min(1, 'La clé API est requise')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Format de clé API invalide'),
});

export const CampaignContextSchema = z.record(
  z.string().min(1, 'Le nom de la campagne ne peut pas être vide'),
  z.string()
    .min(10, 'Le contexte doit contenir au moins 10 caractères')
    .max(500, 'Le contexte ne peut pas dépasser 500 caractères')
);

export const SheetUrlSchema = z.object({
  url: z.string()
    .url('URL invalide')
    .refine(
      (url) => url.includes('docs.google.com/spreadsheets'),
      { message: 'Doit être une URL Google Sheets valide' }
    ),
});

// Types TypeScript générés à partir des schémas
export type ClientFormData = z.infer<typeof ClientSchema>;
export type CampaignFormData = z.infer<typeof CampaignSchema>;
export type GenerationOptionsData = z.infer<typeof GenerationOptionsSchema>;
export type ApiKeyData = z.infer<typeof ApiKeySchema>;
export type CampaignContextData = z.infer<typeof CampaignContextSchema>;
export type SheetUrlData = z.infer<typeof SheetUrlSchema>;