
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
      if (!sheetData || !sheetData.content || sheetData.content.length <= 1) {
        return this.getDefaultCampaign();
      }
      
      // Ignorer la ligne d'en-tête
      const rows = sheetData.content.slice(1);
      
      // Regrouper par campagne
      const campaignMap = new Map<string, any[]>();
      rows.forEach((row: any[]) => {
        if (row.length >= 3 && row[0]) {
          const campaignName = row[0];
          if (!campaignMap.has(campaignName)) {
            campaignMap.set(campaignName, []);
          }
          campaignMap.get(campaignName)?.push(row);
        }
      });
      
      // Convertir en structure de données
      const campaigns: Campaign[] = [];
      campaignMap.forEach((rows, campaignName) => {
        const adGroups: AdGroup[] = [];
        const processedAdGroups = new Set<string>();
        
        rows.forEach(row => {
          if (row.length >= 3 && row[1] && !processedAdGroups.has(row[1])) {
            const adGroupName = row[1];
            processedAdGroups.add(adGroupName);
            
            // Extraire les mots-clés
            const keywords = row[2] ? String(row[2]).split(',').map(k => k.trim()).filter(k => k) : [];
            
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
      
      return campaigns.length > 0 ? campaigns : this.getDefaultCampaign();
    } catch (error) {
      console.error("Erreur lors de l'extraction des campagnes:", error);
      return this.getDefaultCampaign();
    }
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
