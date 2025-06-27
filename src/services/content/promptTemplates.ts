
export interface PromptVariables {
  adGroupName: string;
  keywords: string;
  clientContext: string;
  campaignContext: string;
}

export interface ContentLimits {
  titleMaxLength: number;
  descriptionMaxLength: number;
  maxTitles: number;
  maxDescriptions: number;
}

export class PromptTemplates {
  private static readonly DEFAULT_LIMITS: ContentLimits = {
    titleMaxLength: 30,
    descriptionMaxLength: 90,
    maxTitles: 10,
    maxDescriptions: 5
  };

  static buildTitlesPrompt(variables: PromptVariables): string {
    const { adGroupName, keywords, clientContext, campaignContext } = variables;
    
    // Limiter la taille du contexte client pour éviter les erreurs de limite
    const truncatedClientContext = clientContext && clientContext.length > 800 
      ? clientContext.substring(0, 800) + "..." 
      : clientContext;
    
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

En vous basant sur les informations concernant l'annonceur : '''${truncatedClientContext}''', 
et sur le role de la campagne : '''${campaignContext}''',
ainsi que sur le nom de l'ad group qui permet soit d'obtenir le nom d'une marque soit la typologie ou l'univers produit : '''${adGroupName}''', enfin il faut utiliser les top mots clés de l'ad group : ${keywords} pour bien identifier l'univers sémantique.  Rédigez une liste de 10 titres à la fois sobres et engageants pour les annonces Google en ne mentionnant la marque seulement que pour 5 titres, alignés avec le sujet de l'ad group en respectant strictement 30 caractères maximum, ne pas proposer si ça dépasse. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque titre doit être l'une en dessous de l'autre sans numéro ou tiret ou police particulière.`;
  }

  static buildDescriptionsPrompt(variables: PromptVariables): string {
    const { adGroupName, keywords, clientContext, campaignContext } = variables;
    
    // Limiter la taille du contexte client pour éviter les erreurs de limite
    const truncatedClientContext = clientContext && clientContext.length > 800 
      ? clientContext.substring(0, 800) + "..." 
      : clientContext;
    
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

En vous basant sur les informations concernant l'annonceur : '''${truncatedClientContext}''', 
et sur le role de la campagne : '''${campaignContext}''',
ainsi que sur le nom de l'ad group qui permet soit d'obtenir le nom d'une marque soit la typologie ou l'univers produit : '''${adGroupName}''', enfin il faut utiliser les top mots clés de l'ad group : ${keywords} pour bien identifier l'univers sémantique. Rédigez une liste de 5 descriptions engageantes pour les annonces Google, alignés avec le sujet de l'ad groupt en respectant strictement 90 caractères maximum. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque description doit être l'une en dessous de l'autre sans numéro ou tiret ou police particulière.`;
  }

  static validateAndFilterContent(
    content: string[], 
    maxLength: number, 
    maxCount: number, 
    contentType: 'title' | 'description'
  ): { valid: string[], invalid: string[], stats: { totalGenerated: number, validCount: number, invalidCount: number } } {
    const valid: string[] = [];
    const invalid: string[] = [];

    // Nettoyer et parser le contenu
    const cleanedContent = content
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+[\.\)]/)) // Supprime les numéros
      .filter(line => line.length > 0); // Supprime les lignes vides

    for (const item of cleanedContent) {
      if (item.length <= maxLength) {
        if (valid.length < maxCount) {
          valid.push(item);
        }
      } else {
        invalid.push(item);
        console.warn(`${contentType} trop long (${item.length}/${maxLength} caractères): "${item}"`);
      }
    }

    const stats = {
      totalGenerated: cleanedContent.length,
      validCount: valid.length,
      invalidCount: invalid.length
    };

    // Log des statistiques
    console.log(`Validation ${contentType}s:`, stats);
    if (invalid.length > 0) {
      console.warn(`${invalid.length} ${contentType}(s) rejeté(s) pour dépassement de limite:`, invalid);
    }

    return { valid, invalid, stats };
  }

  static parseGeneratedTitles(generatedText: string, limits = this.DEFAULT_LIMITS): string[] {
    const lines = generatedText.split('\n');
    const result = this.validateAndFilterContent(
      lines, 
      limits.titleMaxLength, 
      limits.maxTitles, 
      'title'
    );
    
    return result.valid;
  }

  static parseGeneratedDescriptions(generatedText: string, limits = this.DEFAULT_LIMITS): string[] {
    const lines = generatedText.split('\n');
    const result = this.validateAndFilterContent(
      lines, 
      limits.descriptionMaxLength, 
      limits.maxDescriptions, 
      'description'
    );
    
    return result.valid;
  }

  static getValidationReport(titles: string[], descriptions: string[], limits = this.DEFAULT_LIMITS) {
    const titleValidation = this.validateAndFilterContent(titles, limits.titleMaxLength, limits.maxTitles, 'title');
    const descriptionValidation = this.validateAndFilterContent(descriptions, limits.descriptionMaxLength, limits.maxDescriptions, 'description');

    return {
      titles: titleValidation,
      descriptions: descriptionValidation,
      summary: {
        totalTitlesValid: titleValidation.valid.length,
        totalDescriptionsValid: descriptionValidation.valid.length,
        totalTitlesRejected: titleValidation.invalid.length,
        totalDescriptionsRejected: descriptionValidation.invalid.length
      }
    };
  }
}
