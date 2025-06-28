import { inputSanitizationService } from "../security/inputSanitizationService";

export interface GoogleSheetsValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
  securityWarnings?: string[];
}

class GoogleSheetsValidationService {
  private readonly ALLOWED_DOMAINS = [
    'docs.google.com',
    'sheets.google.com'
  ];

  private readonly SUSPICIOUS_PATTERNS = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /on\w+=/i,
    /eval\(/i,
    /document\./i,
    /window\./i
  ];

  /**
   * Validation complète des URLs Google Sheets avec vérifications de sécurité
   */
  validateGoogleSheetsUrl(url: string): GoogleSheetsValidationResult {
    const warnings: string[] = [];
    
    // Validation de base
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'URL requise et doit être une chaîne de caractères'
      };
    }

    // Vérifier les patterns suspects
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(url)) {
        warnings.push('Pattern suspect détecté dans l\'URL');
        return {
          isValid: false,
          error: 'L\'URL contient du contenu potentiellement dangereux',
          securityWarnings: warnings
        };
      }
    }

    // Nettoyer l'URL en supprimant les caractères dangereux
    const sanitizedUrl = url.replace(/[<>'"]/g, '').trim();
    
    // Validation de longueur
    if (sanitizedUrl.length > 2000) {
      return {
        isValid: false,
        error: 'URL trop longue (max 2000 caractères)',
        securityWarnings: warnings
      };
    }

    try {
      // Nettoyer l'URL des paramètres de fragment avant validation
      const cleanUrl = sanitizedUrl.split('#')[0];
      const urlObj = new URL(cleanUrl);
      
      // Validation du protocole
      if (urlObj.protocol !== 'https:') {
        warnings.push('URL non-HTTPS détectée');
        return {
          isValid: false,
          error: 'Seules les URLs HTTPS sont autorisées',
          securityWarnings: warnings
        };
      }

      // Validation du domaine
      const isValidDomain = this.ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isValidDomain) {
        warnings.push('Domaine non autorisé');
        return {
          isValid: false,
          error: 'L\'URL doit provenir de Google Sheets',
          securityWarnings: warnings
        };
      }

      // Validation du chemin
      if (!urlObj.pathname.includes('/spreadsheets/')) {
        return {
          isValid: false,
          error: 'L\'URL doit être un document Google Sheets valide',
          securityWarnings: warnings
        };
      }

      // Vérifications de sécurité supplémentaires
      if (urlObj.pathname.includes('..')) {
        warnings.push('Tentative de path traversal détectée');
        return {
          isValid: false,
          error: 'Chemin invalide dans l\'URL',
          securityWarnings: warnings
        };
      }

      // Validation spécifique pour Google Sheets - vérifier la présence de l'ID
      const hasSpreadsheetId = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.test(urlObj.pathname);
      if (!hasSpreadsheetId) {
        return {
          isValid: false,
          error: 'URL Google Sheets invalide - ID de feuille manquant',
          securityWarnings: warnings
        };
      }

      return {
        isValid: true,
        sanitizedUrl: sanitizedUrl,
        securityWarnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Format d\'URL invalide',
        securityWarnings: warnings
      };
    }
  }

  /**
   * Extraire et valider l'ID Google Sheets depuis l'URL
   */
  extractGoogleSheetsId(url: string): { id: string | null; error?: string } {
    const validation = this.validateGoogleSheetsUrl(url);
    
    if (!validation.isValid) {
      return { id: null, error: validation.error };
    }

    try {
      // Nettoyer l'URL des paramètres avant extraction
      const cleanUrl = validation.sanitizedUrl!.split('#')[0].split('?')[0];
      const urlObj = new URL(cleanUrl);
      const pathParts = urlObj.pathname.split('/');
      const dIndex = pathParts.indexOf('d');
      
      if (dIndex === -1 || dIndex >= pathParts.length - 1) {
        return { id: null, error: 'Impossible d\'extraire l\'ID de la feuille depuis l\'URL' };
      }

      const sheetId = pathParts[dIndex + 1];
      
      // Valider le format de l'ID (validation basique)
      if (!sheetId || sheetId.length < 10) {
        return { id: null, error: 'Format d\'ID de feuille invalide' };
      }

      // Nettoyer l'ID
      const sanitizedId = inputSanitizationService.sanitizeText(sheetId);
      
      return { id: sanitizedId };
    } catch (error) {
      return { id: null, error: 'Échec de l\'extraction de l\'ID de la feuille' };
    }
  }

  /**
   * Valider la structure des données de feuille pour la sécurité
   */
  validateSheetData(data: any): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid data format' };
    }

    // Vérifier la taille des données (prévenir DoS)
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 10 * 1024 * 1024) { // Limite de 10MB
      return { isValid: false, error: 'Data too large' };
    }

    // Valider le tableau de contenu
    if (data.values && Array.isArray(data.values)) {
      // Limiter le nombre de lignes/colonnes
      if (data.values.length > 10000) {
        return { isValid: false, error: 'Too many rows in sheet data' };
      }

      for (const row of data.values) {
        if (Array.isArray(row) && row.length > 1000) {
          return { isValid: false, error: 'Too many columns in sheet data' };
        }
      }
    }

    return { isValid: true };
  }
}

export const googleSheetsValidationService = new GoogleSheetsValidationService();
