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
   * Construit le prompt unifié optimisé pour la génération Google Ads
   */
  static buildUnifiedPrompt(options: UnifiedContentGenerationOptions): string {
    const industry = options.industry || 'général';
    const targetPersona = options.targetPersona || 'clients potentiels';
    
    // Déterminer la stratégie spécifique au secteur
    const industryStrategy = this.getIndustryStrategy(industry);
    const keywordStrategy = this.getKeywordStrategy(options.keywords);
    
    return `Tu es un expert en rédaction publicitaire Google Ads avec une expertise pointue en conversion.

═══════════════════════════════════════════════════════════════
📊 ANALYSE DU CONTEXTE
═══════════════════════════════════════════════════════════════

🏢 ENTREPRISE :
${options.clientContext}

🎯 SECTEUR : ${industry}
${industryStrategy}

👥 CIBLE : ${targetPersona}

🚀 CAMPAGNE : ${options.campaignContext}
📱 GROUPE : ${options.adGroupContext}
🔑 MOTS-CLÉS : ${options.keywords.join(' • ')}

${keywordStrategy}

═══════════════════════════════════════════════════════════════
🎯 MISSION CRITIQUE
═══════════════════════════════════════════════════════════════

Génère du contenu publicitaire ULTRA-PERFORMANT qui CONVERTIT :

📝 15 TITRES (max 30 caractères chacun)
📄 4 DESCRIPTIONS (55-90 caractères chacune)

═══════════════════════════════════════════════════════════════
⚡ STRATÉGIES OBLIGATOIRES
═══════════════════════════════════════════════════════════════

🔥 TITRES - Mix obligatoire :
• 3 titres BÉNÉFICES directs (ex: "Économisez 50% Maintenant")
• 3 titres URGENCE/EXCLUSIVITÉ (ex: "Offre Limitée - 48h")  
• 3 titres PREUVE SOCIALE (ex: "+10,000 Clients Satisfaits")
• 3 titres AUTORITÉ/EXPERTISE (ex: "Expert Certifié #1")
• 3 titres EMOTION/DÉSIR (ex: "Transformez Votre Vie")

💎 DESCRIPTIONS - Formules gagnantes :
• Desc 1: [PROBLÈME] → [SOLUTION] → [CTA]
• Desc 2: [BÉNÉFICE] → [PREUVE] → [URGENCE] 
• Desc 3: [AUTORITÉ] → [RÉSULTAT] → [ACTION]
• Desc 4: [ÉMOTION] → [TRANSFORMATION] → [CONTACT]

═══════════════════════════════════════════════════════════════
📏 CONTRAINTES TECHNIQUES
═══════════════════════════════════════════════════════════════

✅ TITRES : Exactement 30 caractères MAX
✅ DESCRIPTIONS : Entre 55-90 caractères (optimal 80-85)
✅ Intégration naturelle des mots-clés (pas de bourrage)
✅ Chaque élément UNIQUE et VARIÉ
✅ Ton approprié au secteur
✅ Appels à l'action puissants
✅ Sans caractères spéciaux problématiques

═══════════════════════════════════════════════════════════════
🎭 TON ET STYLE
═══════════════════════════════════════════════════════════════

${this.getToneGuideline(industry)}

═══════════════════════════════════════════════════════════════
📊 FORMAT DE RÉPONSE (JSON STRICT)
═══════════════════════════════════════════════════════════════

{
  "titles": [
    "15 titres uniques de max 30 caractères",
    "Mélange des 5 stratégies obligatoires",
    "..."
  ],
  "descriptions": [
    "Description 1: Formule problème→solution→CTA (55-90 car.)",
    "Description 2: Formule bénéfice→preuve→urgence (55-90 car.)",  
    "Description 3: Formule autorité→résultat→action (55-90 car.)",
    "Description 4: Formule émotion→transformation→contact (55-90 car.)"
  ]
}

⚠️ CRITIQUE : Réponds UNIQUEMENT avec le JSON, aucun texte avant/après !`;
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
        .filter(d => d && typeof d === 'string' && d.length >= 55 && d.length <= 90)
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
          error: 'Aucune description valide générée (min 55, max 90 caractères)'
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
           description.length >= 55 && 
           description.length <= 90 &&
           !description.includes('\n');
  }

  /**
   * Stratégies spécifiques par secteur d'activité
   */
  private static getIndustryStrategy(industry: string): string {
    const strategies = {
      'e-commerce': `
🛒 SPÉCIFICITÉS E-COMMERCE :
• Mettre en avant les promotions/réductions
• Insister sur la livraison gratuite/rapide
• Rassurer sur la sécurité/garanties
• Créer urgence sur stock limité`,

      'services': `
🔧 SPÉCIFICITÉS SERVICES :
• Mettre en avant l'expertise/certifications
• Proposer consultation/devis gratuit
• Rassurer avec témoignages clients
• Créer urgence sur disponibilités`,

      'technologie': `
💻 SPÉCIFICITÉS TECH :
• Mettre en avant l'innovation/performance
• Insister sur la facilité d'utilisation
• Rassurer avec sécurité/conformité
• Créer urgence sur versions limitées`,

      'immobilier': `
🏡 SPÉCIFICITÉS IMMOBILIER :
• Mettre en avant localisation premium
• Insister sur opportunité unique
• Rassurer avec expertise locale
• Créer urgence sur marché tendu`,

      'santé': `
⚕️ SPÉCIFICITÉS SANTÉ :
• Mettre en avant résultats/efficacité
• Insister sur sécurité/certifications
• Rassurer avec témoignages médicaux
• Créer urgence sur bien-être immédiat`,

      'formation': `
🎓 SPÉCIFICITÉS FORMATION :
• Mettre en avant certification/diplôme
• Insister sur employabilité/salaires
• Rassurer avec taux de réussite
• Créer urgence sur places limitées`,

      'default': `
🎯 APPROCHE GÉNÉRALE :
• Mettre en avant bénéfices concrets
• Insister sur rapport qualité/prix
• Rassurer avec garanties/avis
• Créer urgence avec offres limitées`
    };

    return strategies[industry.toLowerCase()] || strategies['default'];
  }

  /**
   * Stratégie d'intégration des mots-clés
   */
  private static getKeywordStrategy(keywords: string[]): string {
    if (!keywords || keywords.length === 0) {
      return `🔑 MOTS-CLÉS : Aucun mot-clé spécifique fourni`;
    }

    const mainKeyword = keywords[0];
    const secondaryKeywords = keywords.slice(1, 3);

    return `
🔍 STRATÉGIE MOTS-CLÉS :
• MOT-CLÉ PRINCIPAL : "${mainKeyword}" → À intégrer dans 60% des titres
• MOTS-CLÉS SECONDAIRES : ${secondaryKeywords.map(k => `"${k}"`).join(', ')}
• RÈGLE : Intégration naturelle sans bourrage
• VARIANTES : Utiliser synonymes et reformulations`;
  }

  /**
   * Guidelines de ton selon le secteur
   */
  private static getToneGuideline(industry: string): string {
    const tones = {
      'e-commerce': 'TON : Dynamique, commercial, orienté promotion',
      'services': 'TON : Professionnel, rassurant, orienté expertise',
      'technologie': 'TON : Innovant, moderne, orienté performance',
      'immobilier': 'TON : Premium, exclusif, orienté opportunité',
      'santé': 'TON : Rassurant, scientifique, orienté résultats',
      'formation': 'TON : Motivant, aspirationnel, orienté avenir',
      'default': 'TON : Professionnel, persuasif, orienté bénéfices'
    };

    return tones[industry.toLowerCase()] || tones['default'];
  }
}