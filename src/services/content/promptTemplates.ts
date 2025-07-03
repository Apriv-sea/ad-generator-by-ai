export interface PromptVariables {
  adGroupName: string;
  keywords: string;
  clientContext: string;
  campaignContext: string;
}

export class PromptTemplates {
  // Template pour les titres - plus contextualisé et riche
  static buildTitlesPrompt(variables: PromptVariables): string {
    return `Tu es un expert en rédaction publicitaire Google Ads avec 10 ans d'expérience.

CONTEXTE BUSINESS:
${variables.clientContext}

CAMPAGNE: ${variables.campaignContext}
GROUPE D'ANNONCES: ${variables.adGroupName}
MOTS-CLÉS CIBLES: ${variables.keywords}

MISSION:
Rédige 3 titres Google Ads percutants et optimisés pour le CTR.

CONTRAINTES TECHNIQUES:
- Maximum 30 caractères par titre
- Inclure au moins un mot-clé principal dans chaque titre
- Utiliser un langage persuasif et orienté action
- Respecter le contexte business du client

RÈGLES DE RÉDACTION:
- Créer un sentiment d'urgence ou d'opportunité
- Mettre en avant la valeur ajoutée unique
- Utiliser des mots d'action forts
- Adapter le ton au secteur d'activité du client

FORMAT DE RÉPONSE:
Un titre par ligne, sans numérotation, sans formatage markdown.`;
  }

  // Template pour les descriptions - plus contextualisé et riche
  static buildDescriptionsPrompt(variables: PromptVariables): string {
    return `Tu es un expert en rédaction publicitaire Google Ads avec 10 ans d'expérience.

CONTEXTE BUSINESS:
${variables.clientContext}

CAMPAGNE: ${variables.campaignContext}
GROUPE D'ANNONCES: ${variables.adGroupName}
MOTS-CLÉS CIBLES: ${variables.keywords}

MISSION:
Rédige 2 descriptions Google Ads convaincantes qui incitent à l'action.

CONTRAINTES TECHNIQUES:
- Maximum 90 caractères par description
- Inclure un appel à l'action clair dans chaque description
- Mettre en avant les bénéfices clients
- Créer de la différenciation par rapport à la concurrence

RÈGLES DE RÉDACTION:
- Expliquer la valeur ajoutée concrète
- Utiliser des verbes d'action puissants
- Créer un sentiment d'exclusivité ou d'urgence
- Adapter le message au parcours client
- Inclure des éléments de réassurance si pertinent

EXEMPLES D'APPELS À L'ACTION:
- "Découvrez", "Profitez", "Commandez", "Réservez", "Demandez"
- "Économisez", "Bénéficiez", "Testez", "Essayez", "Contactez"

FORMAT DE RÉPONSE:
Une description par ligne, sans numérotation, sans formatage markdown.`;
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
