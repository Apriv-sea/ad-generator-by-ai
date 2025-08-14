/**
 * Utilitaire pour parser robustement les réponses JSON des LLM
 * Gère les variations de format entre OpenAI, Anthropic et Gemini
 */

export interface ParseOptions {
  fallbackValue?: any;
  requiredFields?: string[];
  logErrors?: boolean;
}

/**
 * Version ultra-robuste pour les réponses LLM problématiques
 */
export function extractJsonFromLLMResponse<T = any>(content: string): T | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Essayer de trouver du JSON valide avec différentes stratégies
  const strategies = [
    // Stratégie 1: Chercher entre { et } en équilibrant les accolades
    () => {
      let braceCount = 0;
      let startIndex = -1;
      let endIndex = -1;
      
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') {
          if (startIndex === -1) startIndex = i;
          braceCount++;
        } else if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            endIndex = i;
            break;
          }
        }
      }
      
      if (startIndex !== -1 && endIndex !== -1) {
        return content.substring(startIndex, endIndex + 1);
      }
      return null;
    },
    
    // Stratégie 2: Chercher avec regex plus agressive
    () => {
      const match = content.match(/\{[\s\S]*?\}/);
      return match ? match[0] : null;
    },
    
    // Stratégie 3: Nettoyer puis chercher
    () => {
      const cleaned = content
        .replace(/.*?(?=\{)/s, '')
        .replace(/\}.*$/s, '}')
        .replace(/```json|```/gi, '')
        .trim();
      return cleaned.startsWith('{') && cleaned.endsWith('}') ? cleaned : null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const extracted = strategy();
      if (extracted) {
        const parsed = JSON.parse(extracted);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

/**
 * Parse une réponse de LLM qui peut contenir du JSON avec du texte additionnel
 */
export function parseJsonFromLLMResponse<T = any>(
  content: string, 
  options: ParseOptions = {}
): T {
  const { fallbackValue, requiredFields = [], logErrors = true } = options;

  if (!content || typeof content !== 'string') {
    if (logErrors) {
      console.error('Contenu vide ou invalide pour le parsing JSON:', content);
    }
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw new Error('Contenu vide ou invalide');
  }

  try {
    // Étape 1: Nettoyer le contenu des marqueurs markdown et texte superflu
    let cleanedContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .replace(/^```\s*/gi, '')
      .replace(/^.*?(?=\{)/s, '') // Supprimer tout avant le premier {
      .replace(/\}.*$/s, '}') // Supprimer tout après le dernier }
      .trim();

    // Étape 2: Essayer de parser directement le contenu nettoyé
    try {
      const directParse = JSON.parse(cleanedContent);
      if (validateJsonStructure(directParse, requiredFields)) {
        return directParse;
      }
    } catch {
      // Continue vers les autres méthodes
    }

    // Étape 3: Chercher un objet JSON dans le texte
    const jsonMatches = [
      // Pattern principal: { ... }
      /\{[\s\S]*\}/g,
      // Pattern pour arrays: [ ... ]
      /\[[\s\S]*\]/g
    ];

    for (const pattern of jsonMatches) {
      const matches = cleanedContent.match(pattern);
      if (matches) {
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match);
            if (validateJsonStructure(parsed, requiredFields)) {
              return parsed;
            }
          } catch {
            // Continue avec le prochain match
          }
        }
      }
    }

    // Étape 4: Essayer de corriger les erreurs JSON communes
    const correctedContent = fixCommonJsonErrors(cleanedContent);
    try {
      const correctedParse = JSON.parse(correctedContent);
      if (validateJsonStructure(correctedParse, requiredFields)) {
        return correctedParse;
      }
    } catch {
      // Continue vers le fallback
    }

    // Étape 5: Essayer d'extraire le JSON ligne par ligne
    const lines = cleanedContent.split('\n');
    let jsonStart = -1;
    let jsonEnd = -1;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') && jsonStart === -1) {
        jsonStart = i;
        braceCount = 1;
      } else if (jsonStart !== -1) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonLines = lines.slice(jsonStart, jsonEnd + 1);
      try {
        const multilineParse = JSON.parse(jsonLines.join('\n'));
        if (validateJsonStructure(multilineParse, requiredFields)) {
          return multilineParse;
        }
      } catch {
        // Continue vers le fallback
      }
    }

    throw new Error('Impossible de parser le JSON');

  } catch (error) {
    if (logErrors) {
      console.error('Erreur de parsing JSON:', error);
      console.error('Contenu original:', content);
    }

    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    throw error;
  }
}

/**
 * Valide que l'objet JSON a la structure attendue
 */
function validateJsonStructure(obj: any, requiredFields: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Vérifier les champs requis
  for (const field of requiredFields) {
    if (!(field in obj)) {
      return false;
    }
  }

  return true;
}

/**
 * Corrige les erreurs JSON communes dans les réponses des LLM
 */
function fixCommonJsonErrors(content: string): string {
  return content
    // Corriger les guillemets simples
    .replace(/'/g, '"')
    // Corriger les virgules en trop avant }
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    // Corriger les propriétés sans guillemets (plus précis)
    .replace(/(\w+)(\s*:\s*)/g, '"$1"$2')
    // Supprimer les commentaires
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Nettoyer les espaces et retours à la ligne excessifs
    .replace(/\s+/g, ' ')
    .trim();
}
/**
 * Utilitaire spécialisé pour les analyses d'industrie
 */
export function parseIndustryAnalysis(content: string): {
  suggestedIndustry: string;
  confidence: number;
  reasoning: string;
  alternativeOptions: string[];
} {
  return parseJsonFromLLMResponse(content, {
    requiredFields: ['suggestedIndustry', 'confidence'],
    fallbackValue: {
      suggestedIndustry: 'general',
      confidence: 50,
      reasoning: 'Analyse par défaut - impossible de déterminer le secteur',
      alternativeOptions: ['technology', 'services']
    }
  });
}

/**
 * Utilitaire spécialisé pour l'analyse de sites web
 */
export function parseWebsiteAnalysis(content: string): {
  industry: string;
  toneOfVoice: string;
  keyMessages: string[];
  communicationStyle: string;
  brandValues: string[];
  targetAudience: string;
} {
  return parseJsonFromLLMResponse(content, {
    requiredFields: ['industry', 'toneOfVoice'],
    fallbackValue: {
      industry: 'Non déterminé',
      toneOfVoice: 'Professionnel',
      keyMessages: ['Message principal à définir'],
      communicationStyle: 'Style à analyser',
      brandValues: ['À définir'],
      targetAudience: 'Cible à préciser'
    }
  });
}

/**
 * Utilitaire spécialisé pour la recherche sectorielle
 */
export function parseMarketResearch(content: string): {
  competitiveAnalysis: string;
  marketTrends: string;
  opportunities: string[];
  challenges: string[];
} {
  return parseJsonFromLLMResponse(content, {
    requiredFields: ['competitiveAnalysis', 'marketTrends'],
    fallbackValue: {
      competitiveAnalysis: 'Analyse concurrentielle à approfondir',
      marketTrends: 'Tendances du marché à identifier',
      opportunities: ['Opportunités à explorer'],
      challenges: ['Défis à relever']
    }
  });
}

/**
 * Utilitaire spécialisé pour la génération de contexte client
 */
export function parseClientContext(content: string): {
  businessContext: string;
  editorialGuidelines: string;
} {
  return parseJsonFromLLMResponse(content, {
    requiredFields: ['businessContext', 'editorialGuidelines'],
    fallbackValue: {
      businessContext: 'Contexte business à définir en détail',
      editorialGuidelines: 'Guidelines éditoriales à préciser'
    }
  });
}