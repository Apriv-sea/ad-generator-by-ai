// Moteur de prompts unifié - Remplace les 3 anciens systèmes
// Optimisé pour performance, cache intelligent et validation stricte

import { 
  Client, Campaign, AdGroup, GenerationOptions, GeneratedContent, 
  ValidationResult, ServiceResponse, IndustryConfig, LogEntry 
} from '@/types/unified';
import { Logger } from './Logger';

// ==================== INDUSTRY CONFIGURATIONS ====================

const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  'e-commerce': {
    name: 'E-commerce',
    keywords: ['achat', 'commande', 'livraison', 'promo', 'stock'],
    actionWords: ['Achetez', 'Commandez', 'Profitez', 'Découvrez', 'Économisez'],
    urgencyTactics: ['Stock limité', 'Offre limitée', 'Livraison rapide', 'Promo exclusive'],
    valuePropositions: ['Meilleur prix', 'Livraison gratuite', 'Qualité garantie', 'Satisfaction client'],
    callsToAction: ['Commandez maintenant', 'Achetez en ligne', 'Profitez de l\'offre'],
    tone: 'urgent'
  },
  'services': {
    name: 'Services',
    keywords: ['consultation', 'expertise', 'devis', 'conseil', 'accompagnement'],
    actionWords: ['Contactez', 'Demandez', 'Consultez', 'Planifiez', 'Réservez'],
    urgencyTactics: ['Consultation gratuite', 'Devis rapide', 'Expertise locale', 'Disponible immédiatement'],
    valuePropositions: ['Expert certifié', 'Service personnalisé', 'Satisfaction garantie', 'Devis gratuit'],
    callsToAction: ['Contactez-nous', 'Demandez un devis', 'Réservez votre consultation'],
    tone: 'professional'
  },
  'technologie': {
    name: 'Technologie',
    keywords: ['innovation', 'solution', 'performance', 'automatisation', 'digital'],
    actionWords: ['Optimisez', 'Automatisez', 'Simplifiez', 'Innovez', 'Transformez'],
    urgencyTactics: ['Technologie avancée', 'Solution unique', 'Performance optimale'],
    valuePropositions: ['Innovation leader', 'Solution complète', 'Performance garantie'],
    callsToAction: ['Testez la solution', 'Demandez une démo', 'Découvrez l\'innovation'],
    tone: 'professional'
  },
  'default': {
    name: 'Général',
    keywords: ['qualité', 'service', 'expertise', 'solution', 'résultat'],
    actionWords: ['Découvrez', 'Profitez', 'Contactez', 'Essayez', 'Bénéficiez'],
    urgencyTactics: ['Offre limitée', 'Opportunité unique', 'Disponible maintenant'],
    valuePropositions: ['Qualité supérieure', 'Service expert', 'Solution adaptée'],
    callsToAction: ['Contactez-nous', 'Découvrez l\'offre', 'Profitez maintenant'],
    tone: 'friendly'
  }
};

// ==================== CACHE SYSTEM ====================

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
}

class PromptCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 1000 * 60 * 30; // 30 minutes

  generateKey(options: GenerationOptions): string {
    const { model, client, campaign, adGroup } = options;
    return `${model}-${client.industry || 'default'}-${campaign.id}-${adGroup.id}-${JSON.stringify(adGroup.keywords).slice(0, 50)}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: any, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ==================== MAIN ENGINE ====================

export class PromptEngine {
  private static instance: PromptEngine;
  private cache = new PromptCache();
  private logger = new Logger('PromptEngine');

  static getInstance(): PromptEngine {
    if (!PromptEngine.instance) {
      PromptEngine.instance = new PromptEngine();
    }
    return PromptEngine.instance;
  }

  // ==================== MAIN GENERATION METHOD ====================

  async generateContent(options: GenerationOptions): Promise<ServiceResponse<GeneratedContent>> {
    const startTime = Date.now();
    const cacheKey = this.cache.generateKey(options);
    
    try {
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        this.logger.info('Cache hit', { cacheKey, client: options.client.name });
        return {
          success: true,
          data: cachedResult,
          metadata: {
            requestId: `req_${Date.now()}`,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            cacheHit: true
          }
        };
      }

      // Generate new content
      const prompt = this.buildOptimizedPrompt(options);
      const rawContent = await this.callLLMProvider(options.model, prompt);
      const validatedContent = await this.validateAndCorrect(rawContent, options);

      if (!validatedContent.isValid && !validatedContent.correctedContent) {
        throw new Error(`Validation failed: ${validatedContent.errors.map(e => e.message).join(', ')}`);
      }

      const finalContent = validatedContent.correctedContent || {
        titles: [],
        descriptions: [],
        metadata: {
          model: options.model,
          promptId: cacheKey,
          industry: options.industry || 'default',
          timestamp: new Date().toISOString(),
          validationScore: validatedContent.score,
          processingTime: Date.now() - startTime,
          retryCount: 0
        }
      };

      // Cache the result
      this.cache.set(cacheKey, finalContent);

      return {
        success: true,
        data: finalContent,
        metadata: {
          requestId: `req_${Date.now()}`,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          cacheHit: false
        }
      };

    } catch (error) {
      this.logger.error('Generation failed', { error: error.message, options });
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error.message || 'Unknown error during content generation',
          retryable: true
        },
        metadata: {
          requestId: `req_${Date.now()}`,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  // ==================== PROMPT BUILDING ====================

  buildOptimizedPrompt(options: GenerationOptions): string {
    const industry = this.normalizeIndustry(options.industry || options.client.industry);
    const config = INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.default;
    
    const sections = [
      this.buildPersonalitySection(config),
      this.buildContextSection(options),
      this.buildMissionSection(),
      this.buildConstraintsSection(),
      this.buildIndustryRulesSection(config),
      this.buildPersonaSection(options.targetPersona || options.client.targetPersona),
      this.buildExamplesSection(config),
      this.buildFormatSection()
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  private buildPersonalitySection(config: IndustryConfig): string {
    return `Tu es un expert en rédaction publicitaire ${config.name.toLowerCase()} avec 10 ans d'expérience en Google Ads.
Tu maîtrises parfaitement la psychologie des consommateurs et la méthode AIDA.
Ton style est ${config.tone === 'urgent' ? 'dynamique et persuasif' : config.tone === 'professional' ? 'professionnel et crédible' : 'chaleureux et accessible'}.`;
  }

  private buildContextSection(options: GenerationOptions): string {
    return `CONTEXTE CLIENT:
${options.client.businessContext || 'Entreprise générale'}
${options.client.specifics ? `Spécificités: ${options.client.specifics}` : ''}
${options.client.editorialGuidelines ? `Guidelines: ${options.client.editorialGuidelines}` : ''}

CAMPAGNE: ${options.campaign.name || 'Campagne générale'}
GROUPE D'ANNONCES: ${options.adGroup.name}
MOTS-CLÉS: ${options.adGroup.keywords.join(', ')}`;
  }

  private buildMissionSection(): string {
    return `MISSION:
Rédige exactement 15 titres Google Ads ET 4 descriptions Google Ads optimisés pour maximiser le CTR et les conversions.`;
  }

  private buildConstraintsSection(): string {
    return `CONTRAINTES IMPÉRATIVES:
TITRES: 15 titres uniques, maximum 30 caractères chacun
DESCRIPTIONS: 4 descriptions uniques, maximum 90 caractères chacun
- Inclure mots-clés naturellement
- Appels à l'action clairs
- Vérifier le comptage AVANT finalisation`;
  }

  private buildIndustryRulesSection(config: IndustryConfig): string {
    return `RÈGLES SECTORIELLES ${config.name.toUpperCase()}:
Mots d'action privilégiés: ${config.actionWords.join(', ')}
Tactiques d'urgence: ${config.urgencyTactics.join(', ')}
Propositions de valeur: ${config.valuePropositions.join(', ')}`;
  }

  private buildPersonaSection(targetPersona?: string): string {
    if (!targetPersona) return '';
    return `PERSONA CIBLE: ${targetPersona}
Adapter vocabulaire, ton et motivations à cette audience spécifique.`;
  }

  private buildExamplesSection(config: IndustryConfig): string {
    return `APPELS À L'ACTION RECOMMANDÉS:
${config.callsToAction.map(cta => `"${cta}"`).join(', ')}`;
  }

  private buildFormatSection(): string {
    return `FORMAT DE RÉPONSE:
Réponds UNIQUEMENT avec ce JSON valide (aucun texte avant/après):
{
  "titles": ["Titre 1", "Titre 2", ..., "Titre 15"],
  "descriptions": ["Description 1", "Description 2", "Description 3", "Description 4"]
}

CRITICAL: Respecter strictement les limites de caractères.`;
  }

  // ==================== UTILITIES ====================

  private normalizeIndustry(industry?: string): string {
    if (!industry) return 'default';
    
    const normalized = industry.toLowerCase().trim();
    const mappings: Record<string, string> = {
      'ecommerce': 'e-commerce',
      'commerce': 'e-commerce',
      'tech': 'technologie',
      'it': 'technologie',
      'service': 'services',
      'consulting': 'services'
    };
    
    return mappings[normalized] || (INDUSTRY_CONFIGS[normalized] ? normalized : 'default');
  }

  private async callLLMProvider(model: string, prompt: string): Promise<string> {
    // This will be implemented to call the actual LLM service
    // For now, mock implementation
    throw new Error('LLM provider integration needed');
  }

  private async validateAndCorrect(content: string, options: GenerationOptions): Promise<ValidationResult> {
    // This will be implemented with the validation logic
    // For now, mock implementation
    return {
      isValid: false,
      score: 0,
      errors: [],
      warnings: []
    };
  }

  // ==================== PUBLIC UTILITIES ====================

  getIndustryConfig(industry?: string): IndustryConfig {
    const normalized = this.normalizeIndustry(industry);
    return INDUSTRY_CONFIGS[normalized] || INDUSTRY_CONFIGS.default;
  }

  getSupportedIndustries(): string[] {
    return Object.keys(INDUSTRY_CONFIGS).filter(key => key !== 'default');
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }
}