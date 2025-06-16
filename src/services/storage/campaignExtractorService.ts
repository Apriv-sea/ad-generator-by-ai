
import { Campaign, AdGroup } from "../types";
import { SheetData } from "../types/sheetData";

/**
 * Service for extracting campaign data from sheet data
 */
class CampaignExtractorService {
  /**
   * Extract campaigns from sheet data
   */
  extractCampaigns(sheetData: SheetData): Campaign[] {
    try {
      console.log("Début de l'extraction des campagnes avec les données:", sheetData);
      
      if (!sheetData || !sheetData.content || sheetData.content.length <= 1) {
        console.log("Données insuffisantes pour l'extraction");
        return this.getDefaultCampaign();
      }
      
      const headers = sheetData.content[0] || [];
      const rows = sheetData.content.slice(1);
      
      console.log("En-têtes détectés:", headers);
      console.log(`${rows.length} lignes de données à traiter`);
      
      // Trouver les indices des colonnes importantes
      const campaignIndex = this.findColumnIndex(headers, ['campagne', 'campaign', 'nom de la campagne']);
      const adGroupIndex = this.findColumnIndex(headers, ['groupe', 'adgroup', 'ad group', 'nom du groupe']);
      const keywordsIndex = this.findColumnIndex(headers, ['mots-clés', 'keywords', 'mots clés', 'top 3 mots-clés']);
      
      console.log(`Indices trouvés - Campagne: ${campaignIndex}, Groupe: ${adGroupIndex}, Mots-clés: ${keywordsIndex}`);
      
      if (campaignIndex === -1 || adGroupIndex === -1 || keywordsIndex === -1) {
        console.log("Colonnes requises non trouvées, structure par défaut");
        return this.getDefaultCampaign();
      }
      
      // Regrouper par campagne
      const campaignMap = new Map<string, any[]>();
      
      rows.forEach((row: any[], index) => {
        if (row.length > Math.max(campaignIndex, adGroupIndex, keywordsIndex)) {
          const campaignName = this.cleanText(row[campaignIndex]);
          if (campaignName) {
            if (!campaignMap.has(campaignName)) {
              campaignMap.set(campaignName, []);
            }
            campaignMap.get(campaignName)?.push(row);
            console.log(`Ligne ${index + 2}: ${campaignName} > ${this.cleanText(row[adGroupIndex])}`);
          }
        }
      });
      
      console.log(`${campaignMap.size} campagnes uniques trouvées`);
      
      // Convertir en structure de données
      const campaigns: Campaign[] = [];
      campaignMap.forEach((rows, campaignName) => {
        const adGroups: AdGroup[] = [];
        const processedAdGroups = new Set<string>();
        
        rows.forEach(row => {
          const adGroupName = this.cleanText(row[adGroupIndex]);
          if (adGroupName && !processedAdGroups.has(adGroupName)) {
            processedAdGroups.add(adGroupName);
            
            // Extraire les mots-clés
            const keywordsText = this.cleanText(row[keywordsIndex]);
            const keywords = keywordsText 
              ? keywordsText.split(/[,;|\n]/).map(k => k.trim()).filter(k => k.length > 0)
              : [];
            
            adGroups.push({
              name: adGroupName,
              keywords: keywords.length > 0 ? keywords : [""],
              context: ""
            });
          }
        });
        
        campaigns.push({
          name: campaignName,
          adGroups,
          context: ""
        });
      });
      
      console.log(`Extraction terminée: ${campaigns.length} campagnes générées`);
      return campaigns.length > 0 ? campaigns : this.getDefaultCampaign();
    } catch (error) {
      console.error("Erreur lors de l'extraction des campagnes:", error);
      return this.getDefaultCampaign();
    }
  }

  /**
   * Find column index by searching for partial matches in headers
   */
  private findColumnIndex(headers: string[], searchTerms: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = (headers[i] || '').toLowerCase().trim();
      for (const term of searchTerms) {
        if (header.includes(term.toLowerCase())) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: any): string {
    if (typeof text !== 'string') {
      text = String(text || '');
    }
    return text.trim();
  }

  /**
   * Get a default campaign structure
   */
  private getDefaultCampaign(): Campaign[] {
    return [{
      name: "",
      context: "",
      adGroups: [{
        name: "",
        keywords: ["", "", ""],
        context: ""
      }]
    }];
  }
}

// Export a single instance
export const campaignExtractorService = new CampaignExtractorService();
