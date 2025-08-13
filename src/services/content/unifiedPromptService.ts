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
   * Stratégies spécifiques par secteur d'activité (version étendue)
   */
  private static getIndustryStrategy(industry: string): string {
    const strategies = {
      'e-commerce': `
🛒 SPÉCIFICITÉS E-COMMERCE :
• Mettre en avant les promotions/réductions (-X%, PROMO, SOLDES)
• Insister sur la livraison (gratuite, rapide, 24h, express)
• Rassurer sur la sécurité (paiement sécurisé, garanties, retours)
• Créer urgence sur stock (limité, dernières pièces, rupture)
• Valeur ajoutée (avis clients, bestseller, nouveauté)`,

      'services-professionnels': `
🔧 SPÉCIFICITÉS SERVICES PROFESSIONNELS :
• Mettre en avant l'expertise (certifié, expert, spécialiste, +X ans)
• Proposer consultation (devis gratuit, audit, conseil, analyse)
• Rassurer avec témoignages (clients satisfaits, références, cas clients)
• Créer urgence sur disponibilités (planning, créneaux, intervention)
• Résultats mesurables (ROI, performance, optimisation)`,

      'technologie': `
💻 SPÉCIFICITÉS TECHNOLOGIE :
• Mettre en avant l'innovation (dernière génération, IA, automatisé)
• Insister sur la performance (rapide, efficace, optimisé, stable)
• Rassurer avec sécurité (conformité, protection, crypté, RGPD)
• Facilité d'usage (intuitif, simple, plug&play, no-code)
• Support technique (24/7, formation, accompagnement)`,

      'immobilier': `
🏡 SPÉCIFICITÉS IMMOBILIER :
• Mettre en avant localisation (premium, centre-ville, proche transports)
• Insister sur opportunité (rare, exceptionnel, investissement)
• Rassurer avec expertise (local, négociateur, conseiller)
• Créer urgence sur marché (tendu, demande forte, prix attractif)
• Services inclus (estimation, visite virtuelle, accompagnement)`,

      'sante-bien-etre': `
⚕️ SPÉCIFICITÉS SANTÉ & BIEN-ÊTRE :
• Mettre en avant résultats (efficacité, amélioration, guérison)
• Insister sur sécurité (certifié, professionnel, sans risque)
• Rassurer avec témoignages (patients, transformations, avis)
• Urgence bien-être (douleur, inconfort, qualité de vie)
• Approche personnalisée (sur-mesure, adapté, individualisé)`,

      'formation-education': `
🎓 SPÉCIFICITÉS FORMATION & ÉDUCATION :
• Mettre en avant certification (diplôme, titre, reconnaissance)
• Insister sur employabilité (job, carrière, salaire, débouchés)
• Rassurer avec taux de réussite (%, statistiques, témoignages)
• Créer urgence sur places (limitées, inscription, session)
• Flexibilité (en ligne, rythme, planning, modules)`,

      'finance-assurance': `
💰 SPÉCIFICITÉS FINANCE & ASSURANCE :
• Mettre en avant avantages (taux, économies, rendement, protection)
• Insister sur sécurité (agrément, garantie, ACPR, fiabilité)
• Rassurer avec expertise (conseil, accompagnement, expérience)
• Urgence opportunité (taux, offre limitée, conditions)
• Simplicité (rapide, en ligne, sans paperasse, digital)`,

      'tourisme-loisirs': `
✈️ SPÉCIFICITÉS TOURISME & LOISIRS :
• Mettre en avant expérience (inoubliable, unique, authentique)
• Insister sur prix (promo, all-inclusive, rapport qualité-prix)
• Rassurer avec services (guide, conciergerie, assistance)
• Créer urgence saisonnière (disponibilités, haute saison)
• Émotion et évasion (rêve, détente, découverte, aventure)`,

      'automobile': `
🚗 SPÉCIFICITÉS AUTOMOBILE :
• Mettre en avant qualité (fiabilité, garantie, contrôlé, révisé)
• Insister sur prix (négocié, financement, reprise, occasion)
• Rassurer avec service (entretien, SAV, pièces, réparation)
• Urgence stock (véhicule unique, arrivage, réservation)
• Performance technique (consommation, puissance, équipements)`,

      'restaurant-alimentation': `
🍽️ SPÉCIFICITÉS RESTAURANT & ALIMENTATION :
• Mettre en avant qualité (frais, local, fait maison, bio)
• Insister sur expérience (ambiance, service, tradition, innovation)
• Rassurer avec réputation (avis, chef, établissement, références)
• Urgence événementielle (réservation, événement, saison)
• Spécialités uniques (signature, exclusivité, terroir, authentique)`,

      'mode-beaute': `
👗 SPÉCIFICITÉS MODE & BEAUTÉ :
• Mettre en avant tendance (nouveau, collection, style, tendance)
• Insister sur qualité (premium, luxe, authentique, durable)
• Rassurer avec expertise (conseils, styliste, personnalisé)
• Urgence mode (limité, exclusif, avant tout le monde)
• Transformation (nouveau look, confiance, élégance, beauté)`,

      'construction-renovation': `
🔨 SPÉCIFICITÉS CONSTRUCTION & RÉNOVATION :
• Mettre en avant expertise (artisan, professionnel, qualifié, RGE)
• Insister sur qualité (durabilité, matériaux, finitions, normes)
• Rassurer avec garanties (décennale, assurance, références)
• Urgence projet (devis, planning, saison, disponibilité)
• Économies long terme (isolation, énergie, plus-value, confort)`,

      'sport-fitness': `
💪 SPÉCIFICITÉS SPORT & FITNESS :
• Mettre en avant résultats (transformation, performance, objectifs)
• Insister sur accompagnement (coach, suivi, programme, motivation)
• Rassurer avec méthodes (prouvées, scientifiques, adaptées)
• Urgence forme (été, événement, défi, nouvelle année)
• Bien-être global (santé, confiance, énergie, lifestyle)`,

      'juridique': `
⚖️ SPÉCIFICITÉS JURIDIQUE :
• Mettre en avant expertise (spécialisé, expérience, barreau)
• Insister sur résultats (défense, protection, gain, solution)
• Rassurer avec confidentialité (discrétion, éthique, déontologie)
• Urgence procédure (délais, prescription, urgence, temps)
• Accompagnement humain (écoute, conseil, soutien, proximité)`,

      'default': `
🎯 APPROCHE GÉNÉRALE :
• Mettre en avant bénéfices concrets (gain, économie, amélioration)
• Insister sur rapport qualité/prix (valeur, compétitif, avantageux)
• Rassurer avec garanties (satisfaction, remboursement, sécurité)
• Créer urgence avec offres limitées (temps, quantité, conditions)
• Différenciation (unique, exclusif, spécialisé, leader)`
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
   * Guidelines de ton selon le secteur (version étendue)
   */
  private static getToneGuideline(industry: string): string {
    const tones = {
      'e-commerce': 'TON : Dynamique, commercial, orienté conversion et promotion',
      'services-professionnels': 'TON : Professionnel, rassurant, orienté expertise et résultats',
      'technologie': 'TON : Innovant, moderne, orienté performance et simplicité',
      'immobilier': 'TON : Premium, confiance, orienté opportunité et conseil',
      'sante-bien-etre': 'TON : Rassurant, bienveillant, orienté amélioration et sécurité',
      'formation-education': 'TON : Motivant, aspirationnel, orienté avenir et réussite',
      'finance-assurance': 'TON : Sérieux, sécurisant, orienté protection et avantage',
      'tourisme-loisirs': 'TON : Enthousiaste, évocateur, orienté émotion et évasion',
      'automobile': 'TON : Technique, rassurant, orienté performance et fiabilité',
      'restaurant-alimentation': 'TON : Chaleureux, gourmand, orienté plaisir et qualité',
      'mode-beaute': 'TON : Élégant, inspirant, orienté style et transformation',
      'construction-renovation': 'TON : Solide, fiable, orienté durabilité et qualité',
      'sport-fitness': 'TON : Énergique, motivant, orienté dépassement et bien-être',
      'juridique': 'TON : Sérieux, protecteur, orienté solution et accompagnement',
      'default': 'TON : Professionnel, persuasif, orienté bénéfices et confiance'
    };

    return tones[industry.toLowerCase()] || tones['default'];
  }
}