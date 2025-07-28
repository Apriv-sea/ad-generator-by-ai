export interface UnifiedContentGenerationOptions {
  clientContext: string;
  industry?: string;
  targetPersona?: string;
  campaignContext: string;
  adGroupContext: string;
  keywords: string[];
  model: string;
}

export class UnifiedPromptService {
  /**
   * Prompt unifié et optimisé pour générer titres ET descriptions
   */
  static buildUnifiedPrompt(options: UnifiedContentGenerationOptions): string {
    const industryContext = options.industry ? `SECTEUR D'ACTIVITÉ: ${options.industry}` : '';
    const personaContext = options.targetPersona ? `PUBLIC CIBLE: ${options.targetPersona}` : '';
    
    return `Tu es un expert en rédaction publicitaire Google Ads avec 10 ans d'expérience, spécialisé dans l'optimisation du CTR et des conversions. Tu maîtrises parfaitement la psychologie des consommateurs et les techniques de persuasion.

INFORMATIONS CLIENT:
${options.clientContext}

${industryContext}
${personaContext}

CONTEXTE CAMPAGNE:
Campagne: ${options.campaignContext}
Groupe d'annonces: ${options.adGroupContext}
Mots-clés principaux: ${options.keywords.join(', ')}

MISSION:
Génère EXACTEMENT 15 titres et 4 descriptions Google Ads ultra-percutants qui maximisent le CTR.

CONTRAINTES TECHNIQUES STRICTES:
✅ Titres: EXACTEMENT 15 titres, maximum 30 caractères chacun
✅ Descriptions: EXACTEMENT 4 descriptions, maximum 90 caractères chacune
✅ Inclure naturellement les mots-clés dans chaque élément
✅ Respecter le secteur d'activité et le public cible

STRATÉGIES DE RÉDACTION AVANCÉES:
🎯 URGENCE & EXCLUSIVITÉ: "Derniers jours", "Offre limitée", "Exclusif"
🎯 BÉNÉFICES CONCRETS: Mettre en avant la valeur ajoutée mesurable
🎯 ÉMOTIONS: Susciter désir, confiance, FOMO (Fear of Missing Out)
🎯 DIFFÉRENCIATION: Se démarquer de la concurrence du secteur
🎯 APPELS À L'ACTION PUISSANTS: "Découvrez", "Profitez", "Obtenez", "Transformez"

ADAPTATION SECTORIELLE:
${options.industry ? `- Utilise le vocabulaire et codes spécifiques au secteur ${options.industry}
- Adapte le niveau de technicité au public ${options.targetPersona || 'cible'}
- Intègre les pain points typiques de ce secteur` : '- Adapte le ton au contexte business fourni'}

EXEMPLES DE PATTERNS GAGNANTS:
- "[Bénéfice] en [Délai] | [Mots-clés]"
- "[Action] votre [Objectif] | [USP]"
- "[Résultat] garantis | [CTA]"

FORMAT DE RÉPONSE (JSON STRICT):
{
  "titles": ["Titre 1", "Titre 2", "Titre 3", "Titre 4", "Titre 5", "Titre 6", "Titre 7", "Titre 8", "Titre 9", "Titre 10", "Titre 11", "Titre 12", "Titre 13", "Titre 14", "Titre 15"],
  "descriptions": ["Description 1", "Description 2", "Description 3", "Description 4"]
}

CRITÈRES DE QUALITÉ:
- Chaque titre doit être unique et accrocheur
- Chaque description doit inclure un bénéfice ET un appel à l'action
- Varier les approches: émotionnel, rationnel, urgent, réassurance
- Optimiser pour les différents moments du parcours client

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;
  }

  /**
   * Parse et valide le contenu généré
   */
  static parseGeneratedContent(content: string): {
    success: boolean;
    titles?: string[];
    descriptions?: string[];
    error?: string;
  } {
    try {
      // Nettoyer le contenu pour extraire le JSON
      let cleanContent = content.trim();
      
      // Rechercher le JSON dans le contenu
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      // Parser le JSON
      const parsed = JSON.parse(cleanContent);
      
      // Valider la structure
      if (!parsed.titles || !Array.isArray(parsed.titles) || 
          !parsed.descriptions || !Array.isArray(parsed.descriptions)) {
        return {
          success: false,
          error: 'Structure JSON invalide: titles et descriptions requis'
        };
      }

      // Valider les contraintes de longueur et filtrer
      const validTitles = parsed.titles
        .filter(t => t && typeof t === 'string' && t.length <= 30)
        .slice(0, 15);
        
      const validDescriptions = parsed.descriptions
        .filter(d => d && typeof d === 'string' && d.length <= 90)
        .slice(0, 4);

      if (validTitles.length === 0) {
        return {
          success: false,
          error: 'Aucun titre valide généré (max 30 caractères)'
        };
      }

      if (validDescriptions.length === 0) {
        return {
          success: false,
          error: 'Aucune description valide générée (max 90 caractères)'
        };
      }

      return {
        success: true,
        titles: validTitles,
        descriptions: validDescriptions
      };

    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      return {
        success: false,
        error: `Erreur parsing JSON: ${error.message}`
      };
    }
  }

  /**
   * Valide qu'un titre respecte les contraintes Google Ads
   */
  static validateTitle(title: string): boolean {
    return title && 
           typeof title === 'string' && 
           title.length > 0 && 
           title.length <= 30 &&
           !title.includes('\n');
  }

  /**
   * Valide qu'une description respecte les contraintes Google Ads
   */
  static validateDescription(description: string): boolean {
    return description && 
           typeof description === 'string' && 
           description.length > 0 && 
           description.length <= 90 &&
           !description.includes('\n');
  }
}