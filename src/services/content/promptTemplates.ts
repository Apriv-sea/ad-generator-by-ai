
export interface PromptVariables {
  adGroupName: string;
  keywords: string;
  clientContext: string;
  campaignContext: string;
}

export class PromptTemplates {
  // Template optimisé pour les titres (beaucoup plus court)
  static buildTitlesPrompt(variables: PromptVariables): string {
    // Raccourcir le contexte client à 200 caractères max
    const shortClientContext = variables.clientContext.substring(0, 200);
    
    return `Rédacteur publicitaire expert. 

Annonceur: ${shortClientContext}
Campagne: ${variables.campaignContext}
Groupe: ${variables.adGroupName}
Mots-clés: ${variables.keywords}

Génère 3 titres Google Ads (max 30 caractères chacun).
Format: un titre par ligne, sans numéro ni formatage.`;
  }

  // Template optimisé pour les descriptions (beaucoup plus court)
  static buildDescriptionsPrompt(variables: PromptVariables): string {
    // Raccourcir le contexte client à 200 caractères max
    const shortClientContext = variables.clientContext.substring(0, 200);
    
    return `Rédacteur publicitaire expert.

Annonceur: ${shortClientContext}
Campagne: ${variables.campaignContext}
Groupe: ${variables.adGroupName}
Mots-clés: ${variables.keywords}

Génère 2 descriptions Google Ads (max 90 caractères chacune).
Format: une description par ligne, sans numéro ni formatage.`;
  }

  // Parser optimisé pour les titres
  static parseGeneratedTitles(content: string): string[] {
    if (!content) return [];
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.length <= 30 && !line.match(/^\d+[\.\)]/))
      .slice(0, 3);
  }

  // Parser optimisé pour les descriptions
  static parseGeneratedDescriptions(content: string): string[] {
    if (!content) return [];
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.length <= 90 && !line.match(/^\d+[\.\)]/))
      .slice(0, 2);
  }
}
