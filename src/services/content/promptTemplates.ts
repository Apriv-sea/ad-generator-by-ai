
export interface PromptVariables {
  adGroupName: string;
  keywords: string;
  clientContext: string;
  campaignContext: string;
}

export class PromptTemplates {
  static buildTitlesPrompt(variables: PromptVariables): string {
    const { adGroupName, keywords, clientContext, campaignContext } = variables;
    
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

En vous basant sur les informations concernant l'annonceur : '''${clientContext}''', 
et sur le role de la campagne : '''${campaignContext}''',
ainsi que sur le nom de l'ad group qui permet soit d'obtenir le nom d'une marque soit la typologie ou l'univers produit : '''${adGroupName}''', enfin il faut utiliser les top mots clés de l'ad group : ${keywords} pour bien identifier l'univers sémantique.  Rédigez une liste de 10 titres à la fois sobres et engageants pour les annonces Google en ne mentionnant la marque seulement que pour 5 titres, alignés avec le sujet de l'ad group en respectant strictement 30 caractères maximum, ne pas proposer si ça dépasse. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque titre doit être l'une en dessous de l'autre sans numéro ou tiret ou police particulière.`;
  }

  static buildDescriptionsPrompt(variables: PromptVariables): string {
    const { adGroupName, keywords, clientContext, campaignContext } = variables;
    
    // Placeholder pour le prompt des descriptions - vous pourrez le personnaliser
    return `En vous basant sur les informations concernant l'annonceur : '''${clientContext}''', 
et sur le role de la campagne : '''${campaignContext}''',
ainsi que sur le nom de l'ad group : '''${adGroupName}''', 
et les mots clés : ${keywords},
rédigez 2 descriptions engageantes pour les annonces Google en respectant strictement 90 caractères maximum par description.
Affichez uniquement la liste sans aucun texte préliminaire ou conclusion.`;
  }

  static parseGeneratedTitles(generatedText: string): string[] {
    return generatedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+[\.\)]/)) // Supprime les numéros
      .filter(line => line.length <= 30) // Respecte la limite de caractères
      .slice(0, 10); // Limite à 10 titres
  }

  static parseGeneratedDescriptions(generatedText: string): string[] {
    return generatedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+[\.\)]/)) // Supprime les numéros
      .filter(line => line.length <= 90) // Respecte la limite de caractères
      .slice(0, 2); // Limite à 2 descriptions
  }
}
