
import { VALIDATED_COLUMNS } from '@/services/googleSheetsService';

export interface SheetTemplate {
  id: string;
  name: string;
  description: string;
  headers: string[];
  sampleData: string[][];
}

export const SHEET_TEMPLATES: Record<string, SheetTemplate> = {
  'campaign-basic': {
    id: 'campaign-basic',
    name: 'Template Campagne Basique',
    description: 'Template avec les colonnes essentielles pour les campagnes publicitaires',
    headers: VALIDATED_COLUMNS,
    sampleData: [
      [
        'Campagne Mode Été',
        'Robes d\'été',
        'robe été, mode femme, vêtements',
        '', '', '', '', '', '', '', '', '', '', // Titres vides
        '', '', '', '', '' // Descriptions vides
      ],
      [
        'Campagne Mode Été',
        'Chaussures d\'été',
        'chaussures été, sandales, mode',
        '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', ''
      ]
    ]
  },
  'campaign-complete': {
    id: 'campaign-complete',
    name: 'Template Campagne Complète',
    description: 'Template avec exemples de données pour comprendre le format',
    headers: VALIDATED_COLUMNS,
    sampleData: [
      [
        'Campagne E-commerce Mode',
        'Robes Été Femme',
        'robe été, mode femme, vêtements tendance',
        'Robes Été Tendance',
        'Mode Femme 2024',
        'Vêtements Stylés',
        'Collection Été',
        'Robes Colorées',
        'Style Moderne',
        'Mode Accessible',
        'Tendance Actuelle',
        'Garde-robe Été',
        'Look Parfait',
        'Découvrez notre collection de robes d\'été élégantes et confortables.',
        'Robes modernes pour toutes les occasions. Livraison gratuite.',
        'Style et confort réunis dans nos robes d\'été. Commandez maintenant.',
        'Nouvelle collection été. Robes tendance à prix abordable.',
        'Sublimez votre style avec nos robes d\'été exclusives.'
      ]
    ]
  }
};

export const getTemplateByType = (templateType: string): SheetTemplate => {
  switch (templateType) {
    case 'empty-sheet':
    case 'missing-columns':
      return SHEET_TEMPLATES['campaign-basic'];
    case 'missing-data':
      return SHEET_TEMPLATES['campaign-complete'];
    default:
      return SHEET_TEMPLATES['campaign-basic'];
  }
};
