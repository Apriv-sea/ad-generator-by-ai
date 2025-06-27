import { Campaign, AdGroup } from "../types";
import { SheetData } from "../types/sheetData";
import { inputSanitizationService } from "../security/inputSanitizationService";

/**
 * Service for extracting campaign data from sheet data with enhanced security
 */
class CampaignExtractorService {
  /**
   * Extract campaigns from sheet data with input sanitization
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
      
      // Sanitize sheet data before processing
      const sanitizedContent = this.sanitizeSheetContent(sheetData.content);
      
      const headers = sanitizedContent[0] || [];
      const rows = sanitizedContent.slice(1);
      
      console.log("📊 En-têtes détectés:", headers);
      console.log(`📈 ${rows.length} lignes de données à traiter`);
      console.log("🔢 Aperçu des premières lignes:", rows.slice(0, 3));
      
      // Recherche spécifique pour les en-têtes français de votre feuille
      const campaignIndex = this.findColumnIndex(headers, [
        'campagnes', 'campagne', 'campaign', 'nom de la campagne', 'campaign name',
        'nom campagne', 'campagne name'
      ]);
      const adGroupIndex = this.findColumnIndex(headers, [
        'groupes d\'annonces', 'groupe d\'annonces', 'groupes d annonces', 'groupe d annonces',
        'groupes', 'groupe', 'adgroup', 'ad group', 'nom du groupe', 'group name',
        'nom groupe', 'groupe annonces', 'ad group name', 'nom du groupe d\'annonces'
      ]);
      const keywordsIndex = this.findColumnIndex(headers, [
        'top mots clés', 'top mots-clés', 'mots clés', 'mots-clés', 'keywords', 
        'top 3 mots-clés', 'top 3 mots clés', 'keyword', 'mots cles', 'top3 mots-clés'
      ]);
      
      console.log(`🎯 Indices trouvés - Campagne: ${campaignIndex}, Groupe: ${adGroupIndex}, Mots-clés: ${keywordsIndex}`);
      console.log(`📋 En-têtes mappés:`, {
        campagne: headers[campaignIndex],
        groupe: headers[adGroupIndex], 
        motsCles: headers[keywordsIndex]
      });
      
      if (campaignIndex === -1 || adGroupIndex === -1 || keywordsIndex === -1) {
        console.log("❌ Colonnes requises non trouvées dans les en-têtes");
        console.log("En-têtes disponibles:", headers.map((h, i) => `${i}: "${h}"`));
        console.log("Recherche de:", {
          campagne: campaignIndex === -1 ? "NON TROUVÉ" : "✓",
          groupe: adGroupIndex === -1 ? "NON TROUVÉ" : "✓", 
          motsCles: keywordsIndex === -1 ? "NON TROUVÉ" : "✓"
        });
        return this.getDefaultCampaign(sheetData.id || '');
      }
      
      // Process rows with enhanced security
      const campaigns: Campaign[] = [];
      
      rows.forEach((row: any[], index) => {
        console.log(`📋 Traitement ligne ${index + 2}:`, {
          rowLength: row.length,
          requiredLength: Math.max(campaignIndex, adGroupIndex, keywordsIndex) + 1,
          rawData: row
        });
        
        if (row.length > Math.max(campaignIndex, adGroupIndex, keywordsIndex)) {
          const campaignName = this.cleanAndSanitizeText(row[campaignIndex]);
          const adGroupName = this.cleanAndSanitizeText(row[adGroupIndex]);
          const keywordsText = this.cleanAndSanitizeText(row[keywordsIndex]);
          
          console.log(`📝 Données extraites ligne ${index + 2}:`, {
            campagne: `"${campaignName}"`,
            groupe: `"${adGroupName}"`, 
            motsCles: `"${keywordsText}"`
          });
          
          // Enhanced validation
          if (campaignName && campaignName.length > 0 && adGroupName && adGroupName.length > 0) {
            // Extract and sanitize keywords
            const keywords = keywordsText 
              ? keywordsText.split(/[,;|\n]/)
                  .map(k => inputSanitizationService.sanitizeText(k.trim()))
                  .filter(k => k.length > 0)
              : [];

            console.log(`🔑 Mots-clés extraits pour "${campaignName}":`, keywords);

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

            // Final sanitization of campaign data
            const sanitizedCampaign = inputSanitizationService.sanitizeCampaignData(campaign);
            campaigns.push(sanitizedCampaign);
            
            console.log(`✅ Campagne créée: "${campaignName}" > "${adGroupName}" avec ${keywords.length} mots-clés`);
          } else {
            console.log(`⚠️ Ligne ${index + 2} ignorée: données manquantes`, {
              campagneVide: !campaignName || campaignName.length === 0,
              groupeVide: !adGroupName || adGroupName.length === 0
            });
          }
        } else {
          console.log(`⚠️ Ligne ${index + 2} ignorée: pas assez de colonnes (${row.length} vs ${Math.max(campaignIndex, adGroupIndex, keywordsIndex) + 1} requis)`);
        }
      });
      
      console.log(`🎉 Extraction terminée: ${campaigns.length} campagnes générées sur ${rows.length} lignes traitées`);
      
      if (campaigns.length === 0) {
        console.log("❌ Aucune campagne valide créée - retour campagne par défaut");
        return this.getDefaultCampaign(sheetData.id || '');
      }
      
      return campaigns;
    } catch (error) {
      console.error("💥 Erreur lors de l'extraction des campagnes:", error);
      return this.getDefaultCampaign(sheetData?.id || '');
    }
  }

  /**
   * Sanitize sheet content to prevent XSS and injection attacks
   */
  private sanitizeSheetContent(content: any[][]): any[][] {
    return content.map(row => 
      row.map(cell => {
        if (typeof cell === 'string') {
          return inputSanitizationService.sanitizeText(cell);
        }
        return cell;
      })
    );
  }

  /**
   * Clean and sanitize text with enhanced security
   */
  private cleanAndSanitizeText(text: any): string {
    if (typeof text !== 'string') {
      text = String(text || '');
    }
    return inputSanitizationService.sanitizeText(text.trim());
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
        // Recherche exacte d'abord
        if (header === term.toLowerCase()) {
          console.log(`✅ Match exact trouvé! En-tête "${header}" = "${term}" à l'index ${i}`);
          return i;
        }
        // Puis recherche par inclusion
        if (header.includes(term.toLowerCase())) {
          console.log(`✅ Match partiel trouvé! En-tête "${header}" contient "${term}" à l'index ${i}`);
          return i;
        }
      }
    }
    
    console.log(`❌ Aucun match trouvé pour les termes:`, searchTerms);
    console.log(`📋 En-têtes disponibles:`, headers.map((h, i) => `${i}: "${h}"`));
    return -1;
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

export const campaignExtractorService = new CampaignExtractorService();
