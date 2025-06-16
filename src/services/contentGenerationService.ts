
import { GenerationPrompt } from "./types";
import { enhancedContentGenerationService } from "./content/enhancedContentGenerationService";

export const contentGenerationService = {
  // Méthode principale qui utilise le service amélioré
  generateContent: async (prompt: GenerationPrompt): Promise<{titles: string[], descriptions: string[]} | null> => {
    try {
      console.log("Génération de contenu via le service amélioré");
      
      const result = await enhancedContentGenerationService.generateContent(
        prompt,
        'default-sheet', // TODO: Récupérer le vrai sheetId depuis le contexte
        undefined, // TODO: Passer les données actuelles du sheet
        {
          validateContent: true,
          saveToHistory: true,
          createBackup: false, // Pas de backup pour cette méthode legacy
          autoCleanContent: true,
          maxRegenerateAttempts: 2
        }
      );

      if (result.success) {
        return {
          titles: result.titles,
          descriptions: result.descriptions
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erreur dans contentGenerationService:", error);
      return null;
    }
  }
};
