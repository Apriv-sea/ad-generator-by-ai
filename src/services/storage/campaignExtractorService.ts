
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
      console.log("🔍 Début de l'extraction des campagnes avec les données:", sheetData);
      
      if (!sheetData || !sheetData.content || sheetData.content.length <= 1) {
        console.log("❌ Données insuffisantes pour l'extraction");
        console.log("Structure reçue:", { 
          hasSheetData: !!sheetData, 
          hasContent: !!sheetData?.content, 
          contentLength: sheetData?.content?.length || 0 
        });
        return this.getDefaultCampaign(sheetData?.id || '');
      }
      
      const headers = sheetData.content[0] || [];
      const rows = sheetData.content.slice(1);
      
      console.log("📊 En-têtes détectés:", headers);
      console.log(`📈 ${rows.length} lignes de données à traiter`);
      console.log("🔢 Aperçu des premières lignes:", rows.slice(0, 3));
      
      // Trouver les indices des colonnes importantes avec plus de flexibilité
      const campaignIndex = this.findColumnIndex(headers, [
        'campagne', 'campaign', 'nom de la campagne', 'campaign name',
        'nom campagne', 'campagne name'
      ]);
      const adGroupIndex = this.findColumnIndex(headers, [
        'groupe', 'adgroup', 'ad group', 'nom du groupe', 'group name',
        'nom groupe', 'groupe annonces', 'ad group name', 'nom du groupe d\'annonces'
      ]);
      const keywordsIndex = this.findColumnIndex(headers, [
        'mots-clés', 'keywords', 'mots clés', 'top 3 mots-clés',
        'top 3 mots clés', 'keyword', 'mots cles', 'top3 mots-clés'
      ]);
      
      console.log(`🎯 Indices trouvés - Campagne: ${campaignIndex}, Groupe: ${adGroupIndex}, Mots-clés: ${keywordsIndex}`);
      
      if (campaignIndex === -1 || adGroupIndex === -1 || keywordsIndex === -1) {
        console.log("❌ Colonnes requises non trouvées dans les en-têtes");
        console.log("En-têtes disponibles:", headers.map((h, i) => `${i}: "${h}"`));
        return this.getDefaultCampaign(sheetData.id || '');
      }
      
      // Traiter chaque ligne et créer les campagnes
      const campaigns: Campaign[] = [];
      
      rows.forEach((row: any[], index) => {
        console.log(`📋 Traitement ligne ${index + 2}:`, row);
        
        if (row.length > Math.max(campaignIndex, adGroupIndex, keywordsIndex)) {
          const campaignName = this.cleanText(row[campaignIndex]);
          const adGroupName = this.cleanText(row[adGroupIndex]);
          const keywordsText = this.cleanText(row[keywordsIndex]);
          
          console.log(`📝 Données extraites: Campagne="${campaignName}", Groupe="${adGroupName}", Mots-clés="${keywordsText}"`);
          
          if (campaignName && adGroupName) {
            // Extraire les mots-clés
            const keywords = keywordsText 
              ? keywordsText.split(/[,;|\n]/).map(k => k.trim()).filter(k => k.length > 0)
              : [];

            const campaign: Campaign = {
              id: `${sheetData.id}-campaign-${index}`,
              sheetId: sheetData.id || '',
              name: campaignName,
              campaignName: campaignName,
              adGroupName: adGroupName,
              keywords: keywords.join(', '),
              titles: ['', '', ''],
              descriptions: ['', ''],
              finalUrls: [''],
              displayPaths: ['', ''],
              targetedKeywords: keywords.join(', '),
              negativeKeywords: '',
              targetedAudiences: '',
              adExtensions: '',
              lastModified: sheetData.lastModified || new Date().toISOString(),
              clientInfo: sheetData.clientInfo || null,
              context: '',
              adGroups: [{
                name: adGroupName,
                keywords: keywords.length > 0 ? keywords : [""],
                context: ""
              }]
            };

            campaigns.push(campaign);
            console.log(`✅ Campagne créée: ${campaignName} > ${adGroupName}`);
          } else {
            console.log(`⚠️ Ligne ${index + 2} ignorée: nom de campagne ou groupe manquant`);
          }
        } else {
          console.log(`⚠️ Ligne ${index + 2} ignorée: pas assez de colonnes (${row.length} vs ${Math.max(campaignIndex, adGroupIndex, keywordsIndex) + 1} requis)`);
        }
      });
      
      console.log(`🎉 Extraction terminée: ${campaigns.length} campagnes générées`);
      return campaigns.length > 0 ? campaigns : this.getDefaultCampaign(sheetData.id || '');
    } catch (error) {
      console.error("💥 Erreur lors de l'extraction des campagnes:", error);
      return this.getDefaultCampaign(sheetData?.id || '');
    }
  }

  /**
   * Find column index by searching for partial matches in headers
   */
  private findColumnIndex(headers: string[], searchTerms: string[]): number {
    console.log(`🔍 Recherche de colonnes pour les termes:`, searchTerms);
    
    for (let i = 0; i < headers.length; i++) {
      const header = (headers[i] || '').toLowerCase().trim();
      console.log(`🔍 Vérification en-tête ${i}: "${header}"`);
      
      for (const term of searchTerms) {
        if (header.includes(term.toLowerCase())) {
          console.log(`✅ Match trouvé! En-tête "${header}" contient "${term}" à l'index ${i}`);
          return i;
        }
      }
    }
    
    console.log(`❌ Aucun match trouvé pour les termes:`, searchTerms);
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
  private getDefaultCampaign(sheetId: string): Campaign[] {
    console.log("🔧 Création d'une campagne par défaut pour:", sheetId);
    return [{
      id: `${sheetId}-default-campaign`,
      sheetId: sheetId,
      name: "",
      campaignName: "",
      adGroupName: "",
      keywords: "",
      titles: ["", "", ""],
      descriptions: ["", ""],
      finalUrls: [""],
      displayPaths: ["", ""],
      targetedKeywords: "",
      negativeKeywords: "",
      targetedAudiences: "",
      adExtensions: "",
      lastModified: new Date().toISOString(),
      clientInfo: null,
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
