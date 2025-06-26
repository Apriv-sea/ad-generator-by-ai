
import { Campaign, Client } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validItems?: any[];
}

class DataValidationService {
  /**
   * Valider les données extraites d'une feuille CryptPad
   */
  validateSheetData(data: any[][]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || !Array.isArray(data)) {
      errors.push("Les données doivent être un tableau");
      return { isValid: false, errors, warnings };
    }

    if (data.length === 0) {
      errors.push("La feuille est vide");
      return { isValid: false, errors, warnings };
    }

    if (data.length === 1) {
      warnings.push("Seulement les en-têtes sont présents, aucune donnée");
      return { isValid: false, errors, warnings };
    }

    // Vérifier la structure des en-têtes
    const headers = data[0];
    const requiredColumns = ['Nom de la campagne', 'Nom du groupe d\'annonces'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header && header.toLowerCase().includes(col.toLowerCase()))
    );

    if (missingColumns.length > 0) {
      errors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`);
    }

    // Vérifier la qualité des données
    const dataRows = data.slice(1);
    let validRows = 0;
    let emptyRows = 0;

    dataRows.forEach((row, index) => {
      if (!row || row.length === 0) {
        emptyRows++;
        return;
      }

      const campaignName = row[0];
      const adGroupName = row[1];

      if (!campaignName || !adGroupName) {
        warnings.push(`Ligne ${index + 2}: Nom de campagne ou groupe d'annonces manquant`);
      } else {
        validRows++;
      }
    });

    if (emptyRows > 0) {
      warnings.push(`${emptyRows} ligne(s) vide(s) détectée(s)`);
    }

    if (validRows === 0) {
      errors.push("Aucune ligne de données valide trouvée");
    }

    return {
      isValid: errors.length === 0 && validRows > 0,
      errors,
      warnings,
      validItems: dataRows.filter(row => row && row[0] && row[1])
    };
  }

  /**
   * Valider les campagnes extraites
   */
  validateCampaigns(campaigns: Campaign[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validCampaigns: Campaign[] = [];

    if (!campaigns || campaigns.length === 0) {
      errors.push("Aucune campagne à valider");
      return { isValid: false, errors, warnings };
    }

    campaigns.forEach((campaign, index) => {
      const campaignErrors: string[] = [];

      if (!campaign.campaignName || campaign.campaignName.trim() === '') {
        campaignErrors.push("Nom de campagne manquant");
      }

      if (!campaign.adGroupName || campaign.adGroupName.trim() === '') {
        campaignErrors.push("Nom de groupe d'annonces manquant");
      }

      if (!campaign.keywords || campaign.keywords.trim() === '') {
        warnings.push(`Campagne ${index + 1}: Aucun mot-clé défini`);
      } else {
        const keywordsList = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
        if (keywordsList.length === 0) {
          warnings.push(`Campagne ${index + 1}: Mots-clés vides après traitement`);
        }
      }

      if (campaignErrors.length > 0) {
        errors.push(`Campagne ${index + 1}: ${campaignErrors.join(', ')}`);
      } else {
        validCampaigns.push(campaign);
      }
    });

    return {
      isValid: errors.length === 0 && validCampaigns.length > 0,
      errors,
      warnings,
      validItems: validCampaigns
    };
  }

  /**
   * Valider les informations client
   */
  validateClientInfo(clientInfo: Client | null): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!clientInfo) {
      warnings.push("Aucune information client fournie");
      return { isValid: true, errors, warnings };
    }

    if (!clientInfo.name || clientInfo.name.trim() === '') {
      warnings.push("Nom du client manquant");
    }

    if (!clientInfo.businessContext || clientInfo.businessContext.trim() === '') {
      warnings.push("Contexte métier du client manquant - cela peut affecter la qualité de la génération de contenu");
    }

    return {
      isValid: true, // Les infos client sont optionnelles
      errors,
      warnings
    };
  }

  /**
   * Valider l'URL CryptPad
   */
  validateCryptPadUrl(url: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!url || url.trim() === '') {
      errors.push("URL CryptPad requise");
      return { isValid: false, errors, warnings };
    }

    // Vérifier le format de l'URL CryptPad
    const cryptpadPattern = /^https?:\/\/[^\/]+\/sheet\/#\/[0-9]+\/[a-zA-Z0-9+\/=]+$/;
    
    if (!cryptpadPattern.test(url)) {
      errors.push("Format d'URL CryptPad invalide. Utilisez le format: https://domain/sheet/#/1/pad_id");
    }

    // Vérifier que ce n'est pas une URL de preview
    if (url.includes('/preview/')) {
      warnings.push("URL de prévisualisation détectée - assurez-vous d'avoir les droits d'édition");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const dataValidationService = new DataValidationService();
