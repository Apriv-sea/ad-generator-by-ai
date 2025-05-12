
import { GenerationPrompt } from "./types";
import { toast } from "sonner";

export const contentGenerationService = {
  // Générer du contenu via un LLM
  generateContent: async (prompt: GenerationPrompt): Promise<{titles: string[], descriptions: string[]} | null> => {
    try {
      console.log("Prompt de génération:", prompt);
      
      // Construire le prompt pour les titres
      const titlePrompt = `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group qui permet soit d'obtenir le nom d'une marque soit la typologie ou l'univers produit : '''${prompt.adGroupContext}''', enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.  

Rédigez une liste de 10 titres à la fois sobres et engageants pour les annonces Google en ne mentionnant la marque seulement que pour 5 titres, alignés avec le sujet de l'ad group en respectant strictement 30 caractères maximum, ne pas proposer si ça dépasse. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque titre doit être l'une en dessous de l'autre sans numéro ou tiret ou police particulière.`;

      // Construire le prompt pour les descriptions
      const descriptionPrompt = `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group qui permet soit d'obtenir le nom d'une marque soit la typologie ou l'univers produit : '''${prompt.adGroupContext}''', enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.

Rédigez une liste de 5 descriptions d'annonces Google persuasives et engageantes en respectant strictement 90 caractères maximum, ne pas proposer si ça dépasse. Incluez un appel à l'action clair dans chaque description. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque description doit être l'une en dessous de l'autre sans numéro ou tiret.`;

      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dans un environnement réel, vous feriez un appel API à votre LLM ici
      // Exemple avec le modèle sélectionné par l'utilisateur
      
      // Envoyer les prompts à l'API (simulé pour l'instant)
      let titles: string[] = [];
      let descriptions: string[] = [];
      
      // Si vous implémentez réellement l'appel à l'API, vous pourriez le faire comme ceci:
      /*
      const titleResponse = await fetch('URL_DE_VOTRE_API_LLM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: titlePrompt,
          model: prompt.model,
          // autres paramètres...
        }),
      });
      
      const titleData = await titleResponse.json();
      titles = parseResponseForTitles(titleData);
      
      const descriptionResponse = await fetch('URL_DE_VOTRE_API_LLM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: descriptionPrompt,
          model: prompt.model,
          // autres paramètres...
        }),
      });
      
      const descriptionData = await descriptionResponse.json();
      descriptions = parseResponseForDescriptions(descriptionData);
      */
      
      // Pour l'instant, générer des exemples de titres et descriptions
      titles = [
        `Découvrez ${prompt.keywords[0]} maintenant`,
        `${prompt.keywords[0]} - Solutions efficaces`,
        `${prompt.keywords[1]} pour professionnels`,
        `Meilleur service ${prompt.keywords[0]}`,
        `${prompt.keywords[1]} à prix abordable`,
        `${prompt.keywords[2]} premium`,
        `Solutions ${prompt.keywords[0]} sur mesure`,
        `${prompt.keywords[1]} - Résultats garantis`,
        `Experts en ${prompt.keywords[0]}`,
        `${prompt.keywords[2]} - Action rapide`
      ];
      
      descriptions = [
        `Profitez de nos services de ${prompt.keywords[0]} adaptés à vos besoins. Contactez-nous !`,
        `${prompt.keywords[1]} de qualité avec garantie. Demandez un devis gratuit en ligne.`,
        `Experts en ${prompt.keywords[2]} depuis 10 ans. Appelez-nous dès maintenant.`,
        `Solutions ${prompt.keywords[0]} innovantes à prix compétitif. Cliquez ici !`,
        `${prompt.keywords[1]} et ${prompt.keywords[0]} - Notre équipe à votre service 7j/7.`
      ];
      
      console.log("Contenu généré:", { titles, descriptions });
      return { titles, descriptions };
    } catch (error) {
      console.error("Erreur lors de la génération de contenu:", error);
      toast.error("Impossible de générer le contenu via l'IA");
      return null;
    }
  }
};
