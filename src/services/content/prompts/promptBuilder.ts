// Service de construction de prompts dynamiques et optimisés

import { INDUSTRY_PROMPTS, normalizeIndustryName, type IndustryPromptConfig } from './industryPrompts';

export interface PromptVariables {
  adGroupName: string;
  keywords: string;
  clientContext: string;
  campaignContext: string;
  industry?: string;
  targetPersona?: string;
}

export interface PromptBuilderOptions {
  includeIndustrySpecifics: boolean;
  includePersonaAdaptation: boolean;
  enhancedValidation: boolean;
  strictFormatting: boolean;
}

export class PromptBuilder {
  private static readonly DEFAULT_OPTIONS: PromptBuilderOptions = {
    includeIndustrySpecifics: true,
    includePersonaAdaptation: true,
    enhancedValidation: true,
    strictFormatting: true
  };

  /**
   * Construit un prompt complet optimisé pour un secteur d'activité
   */
  static buildDynamicPrompt(
    variables: PromptVariables, 
    options: Partial<PromptBuilderOptions> = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const industryConfig = this.getIndustryConfig(variables.industry);

    return this.assemblePrompt(variables, industryConfig, opts);
  }

  /**
   * Récupère la configuration spécifique au secteur d'activité
   */
  private static getIndustryConfig(industry?: string): IndustryPromptConfig {
    const normalizedIndustry = normalizeIndustryName(industry);
    return INDUSTRY_PROMPTS[normalizedIndustry] || INDUSTRY_PROMPTS.default;
  }

  /**
   * Assemble le prompt final avec tous les éléments
   */
  private static assemblePrompt(
    variables: PromptVariables,
    industryConfig: IndustryPromptConfig,
    options: PromptBuilderOptions
  ): string {
    const sections = [
      this.buildPersonalitySection(industryConfig),
      this.buildContextSection(variables),
      this.buildMissionSection(),
      this.buildConstraintsSection(options.enhancedValidation),
      this.buildIndustryRulesSection(industryConfig, options.includeIndustrySpecifics),
      this.buildPersonaSection(variables.targetPersona, options.includePersonaAdaptation),
      this.buildExamplesSection(industryConfig),
      this.buildFormatSection(options.strictFormatting)
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Section personnalité de l'IA
   */
  private static buildPersonalitySection(industryConfig: IndustryPromptConfig): string {
    return `${industryConfig.basePersonality}

Vous maîtrisez parfaitement la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et intégrez ces principes dans chaque création.`;
  }

  /**
   * Section contexte business
   */
  private static buildContextSection(variables: PromptVariables): string {
    return `CONTEXTE BUSINESS:
${variables.clientContext}

CAMPAGNE: ${variables.campaignContext}
GROUPE D'ANNONCES: ${variables.adGroupName}
MOTS-CLÉS CIBLES: ${variables.keywords}`;
  }

  /**
   * Section mission
   */
  private static buildMissionSection(): string {
    return `MISSION:
Rédige exactement 15 titres Google Ads ET 4 descriptions Google Ads pour cette campagne.
Chaque élément doit être optimisé pour maximiser le CTR et les conversions.`;
  }

  /**
   * Section contraintes techniques avec validation renforcée
   */
  private static buildConstraintsSection(enhancedValidation: boolean): string {
    let constraints = `CONTRAINTES TECHNIQUES TITRES:
- Exactement 15 titres uniques
- Maximum 30 caractères par titre (IMPÉRATIF)
- Inclure au moins un mot-clé principal dans chaque titre
- Utiliser un langage persuasif et orienté action

CONTRAINTES TECHNIQUES DESCRIPTIONS:
- Exactement 4 descriptions uniques
- Maximum 90 caractères par description (IMPÉRATIF)
- Inclure un appel à l'action clair dans chaque description
- Mettre en avant les bénéfices clients`;

    if (enhancedValidation) {
      constraints += `

VALIDATION RENFORCÉE:
- Vérifier le comptage de caractères AVANT de finaliser
- Éviter les répétitions entre titres et descriptions
- S'assurer que chaque élément est complet et autonome
- Privilégier la clarté à la créativité si conflit`;
    }

    return constraints;
  }

  /**
   * Section règles spécifiques au secteur
   */
  private static buildIndustryRulesSection(
    industryConfig: IndustryPromptConfig, 
    includeSpecifics: boolean
  ): string {
    if (!includeSpecifics) {
      return `RÈGLES DE RÉDACTION:
- Créer un sentiment d'urgence ou d'opportunité
- Mettre en avant la valeur ajoutée unique
- Utiliser des mots d'action forts
- Créer de la différenciation par rapport à la concurrence`;
    }

    return `RÈGLES DE RÉDACTION SECTORIELLES:
${industryConfig.specificRules.map(rule => `- ${rule}`).join('\n')}

MOTS D'ACTION PRIVILÉGIÉS:
${industryConfig.actionWords.join(', ')}

TACTIQUES D'URGENCE:
${industryConfig.urgencyTactics.join(', ')}`;
  }

  /**
   * Section adaptation persona
   */
  private static buildPersonaSection(targetPersona?: string, includePersona: boolean = true): string {
    if (!includePersona || !targetPersona) return '';

    return `ADAPTATION PERSONA:
Public cible: ${targetPersona}
- Adapter le vocabulaire et le ton au public cible
- Utiliser des références et motivations spécifiques à cette audience
- Créer une connexion émotionnelle appropriée`;
  }

  /**
   * Section exemples d'appels à l'action
   */
  private static buildExamplesSection(industryConfig: IndustryPromptConfig): string {
    return `EXEMPLES D'APPELS À L'ACTION:
${industryConfig.callsToAction.map(cta => `- "${cta}"`).join('\n')}

PROPOSITIONS DE VALEUR:
${industryConfig.valuePropositions.map(vp => `- ${vp}`).join('\n')}`;
  }

  /**
   * Section format de réponse
   */
  private static buildFormatSection(strictFormatting: boolean): string {
    let format = `FORMAT DE RÉPONSE:
Réponds UNIQUEMENT avec un JSON valide contenant exactement 15 titres et 4 descriptions :
{
  "titles": [
    "Titre 1",
    "Titre 2",
    ...15 titres de maximum 30 caractères chacun
  ],
  "descriptions": [
    "Description 1 avec appel à l'action",
    "Description 2 avec appel à l'action", 
    "Description 3 avec appel à l'action",
    "Description 4 avec appel à l'action"
  ]
}`;

    if (strictFormatting) {
      format += `

IMPORTANT: 
- Aucun texte avant ou après le JSON
- Aucun commentaire ou explication
- JSON parfaitement formaté et valide
- Respect strict des limites de caractères`;
    }

    return format;
  }

  /**
   * Méthode utilitaire pour obtenir des suggestions d'amélioration
   */
  static getIndustrySuggestions(industry?: string): {
    actionWords: string[];
    urgencyTactics: string[];
    valuePropositions: string[];
  } {
    const config = this.getIndustryConfig(industry);
    return {
      actionWords: config.actionWords,
      urgencyTactics: config.urgencyTactics,
      valuePropositions: config.valuePropositions
    };
  }
}