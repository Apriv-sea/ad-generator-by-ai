export interface PromptVariables {
  adGroupName: string;
  keywords: string;
  clientContext: string;
  campaignContext: string;
}

export class PromptTemplates {
  // Template pour générer titres ET descriptions ensemble
  static buildCompletePrompt(variables: PromptVariables): string {
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

Tu es un expert en rédaction publicitaire Google Ads avec 10 ans d'expérience.

CONTEXTE BUSINESS:
${variables.clientContext}

CAMPAGNE: ${variables.campaignContext}
GROUPE D'ANNONCES: ${variables.adGroupName}
MOTS-CLÉS CIBLES: ${variables.keywords}

MISSION:
Rédige 15 titres Google Ads ET 4 descriptions Google Ads pour cette campagne.

CONTRAINTES TECHNIQUES TITRES:
- Exactement 15 titres
- Maximum 30 caractères par titre
- Inclure au moins un mot-clé principal dans chaque titre
- Utiliser un langage persuasif et orienté action

CONTRAINTES TECHNIQUES DESCRIPTIONS:
- Exactement 4 descriptions  
- Maximum 90 caractères par description
- Inclure un appel à l'action clair dans chaque description
- Mettre en avant les bénéfices clients

RÈGLES DE RÉDACTION:
- Créer un sentiment d'urgence ou d'opportunité
- Mettre en avant la valeur ajoutée unique
- Utiliser des mots d'action forts
- Adapter le ton au secteur d'activité du client
- Créer de la différenciation par rapport à la concurrence

FORMAT DE RÉPONSE:
Réponds UNIQUEMENT avec un JSON valide contenant exactement 15 titres et 4 descriptions :
{
  "titles": [
    "Titre 1",
    "Titre 2",
    ...15 titres maximum 30 caractères chacun
  ],
  "descriptions": [
    "Description 1 avec appel à l'action",
    "Description 2 avec appel à l'action", 
    "Description 3 avec appel à l'action",
    "Description 4 avec appel à l'action"
  ]
}`;
  }

  // Template pour les titres - plus contextualisé et riche
  static buildTitlesPrompt(variables: PromptVariables): string {
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

Tu es un expert en rédaction publicitaire Google Ads avec 10 ans d'expérience.

CONTEXTE BUSINESS:
${variables.clientContext}

CAMPAGNE: ${variables.campaignContext}
GROUPE D'ANNONCES: ${variables.adGroupName}
MOTS-CLÉS CIBLES: ${variables.keywords}

MISSION:
Rédige 15 titres Google Ads percutants et optimisés pour le CTR.

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
Réponds UNIQUEMENT avec un JSON valide contenant exactement 15 titres :
{
  "titles": [
    "Titre 1",
    "Titre 2",
    ...15 titres maximum 30 caractères chacun
  ]
}`;
  }

  // Template pour les descriptions - plus contextualisé et riche
  static buildDescriptionsPrompt(variables: PromptVariables): string {
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

Tu es un expert en rédaction publicitaire Google Ads avec 10 ans d'expérience.

CONTEXTE BUSINESS:
${variables.clientContext}

CAMPAGNE: ${variables.campaignContext}
GROUPE D'ANNONCES: ${variables.adGroupName}
MOTS-CLÉS CIBLES: ${variables.keywords}

MISSION:
Rédige 4 descriptions Google Ads convaincantes qui incitent à l'action.

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
Réponds UNIQUEMENT avec un JSON valide contenant exactement 4 descriptions :
{
  "descriptions": [
    "Description 1",
    "Description 2",
    "Description 3", 
    "Description 4"
  ]
}`;
  }

  // Parser optimisé pour les titres
  static parseGeneratedTitles(content: string): string[] {
    if (!content) return [];
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.length <= 30 && !line.match(/^\d+[\.\)]/))
      .slice(0, 15);
  }

  // Parser optimisé pour les descriptions
  static parseGeneratedDescriptions(content: string): string[] {
    if (!content) return [];
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.length <= 90 && !line.match(/^\d+[\.\)]/))
      .slice(0, 4);
  }
}
