/**
 * Service pour gérer les contextes des campagnes
 */

const CAMPAIGN_CONTEXTS_KEY = 'campaign_contexts';

export interface CampaignContexts {
  [campaignName: string]: string;
}

export class CampaignContextService {
  /**
   * Extraire les noms de campagnes uniques de la colonne A
   */
  static extractCampaignNames(sheetData: string[][]): string[] {
    if (!sheetData || sheetData.length <= 1) {
      return [];
    }

    const campaigns = new Set<string>();
    
    // Ignorer la première ligne (headers) et extraire la colonne A
    for (let i = 1; i < sheetData.length; i++) {
      const campaignName = sheetData[i][0]?.trim();
      if (campaignName && campaignName !== '') {
        campaigns.add(campaignName);
      }
    }

    return Array.from(campaigns).sort();
  }

  /**
   * Sauvegarder les contextes des campagnes
   */
  static saveContexts(contexts: CampaignContexts): void {
    try {
      localStorage.setItem(CAMPAIGN_CONTEXTS_KEY, JSON.stringify(contexts));
      console.log('✅ Contextes des campagnes sauvegardés:', contexts);
    } catch (error) {
      console.error('❌ Erreur sauvegarde contextes:', error);
    }
  }

  /**
   * Récupérer les contextes des campagnes
   */
  static loadContexts(): CampaignContexts {
    try {
      const stored = localStorage.getItem(CAMPAIGN_CONTEXTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Erreur chargement contextes:', error);
    }
    return {};
  }

  /**
   * Obtenir le contexte d'une campagne spécifique
   */
  static getContextForCampaign(campaignName: string): string {
    const contexts = this.loadContexts();
    return contexts[campaignName] || '';
  }

  /**
   * Vérifier si tous les contextes sont renseignés pour les campagnes données
   */
  static areContextsComplete(campaigns: string[]): boolean {
    const contexts = this.loadContexts();
    return campaigns.every(campaign => contexts[campaign]?.trim());
  }

  /**
   * Obtenir les campagnes manquantes (sans contexte)
   */
  static getMissingContexts(campaigns: string[]): string[] {
    const contexts = this.loadContexts();
    return campaigns.filter(campaign => !contexts[campaign]?.trim());
  }
}