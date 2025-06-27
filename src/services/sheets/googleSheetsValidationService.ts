
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
        error: 'URL is required and must be a string'
      };
    }

    // Vérifier les patterns suspects
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(url)) {
        warnings.push('Suspicious pattern detected in URL');
        return {
          isValid: false,
          error: 'URL contains potentially dangerous content',
          securityWarnings: warnings
        };
      }
    }

    // Nettoyer l'URL
    const sanitizedUrl = url.replace(/[<>'"]/g, '').trim();
    
    // Validation de longueur
    if (sanitizedUrl.length > 2000) {
      return {
        isValid: false,
        error: 'URL is too long (max 2000 characters)',
        securityWarnings: warnings
      };
    }

    try {
      const urlObj = new URL(sanitizedUrl);
      
      // Validation du protocole
      if (urlObj.protocol !== 'https:') {
        warnings.push('Non-HTTPS URL detected');
        return {
          isValid: false,
          error: 'Only HTTPS URLs are allowed',
          securityWarnings: warnings
        };
      }

      // Validation du domaine
      const isValidDomain = this.ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isValidDomain) {
        warnings.push('Non-whitelisted domain');
        return {
          isValid: false,
          error: 'URL must be from Google Sheets',
          securityWarnings: warnings
        };
      }

      // Validation du chemin
      if (!urlObj.pathname.includes('/spreadsheets/')) {
        return {
          isValid: false,
          error: 'URL must be a Google Sheets document',
          securityWarnings: warnings
        };
      }

      // Vérifications de sécurité supplémentaires
      if (urlObj.pathname.includes('..')) {
        warnings.push('Path traversal attempt detected');
        return {
          isValid: false,
          error: 'Invalid path in URL',
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
        error: 'Invalid URL format',
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
      const urlObj = new URL(validation.sanitizedUrl!);
      const pathParts = urlObj.pathname.split('/');
      const dIndex = pathParts.indexOf('d');
      
      if (dIndex === -1 || dIndex >= pathParts.length - 1) {
        return { id: null, error: 'Could not extract sheet ID from URL' };
      }

      const sheetId = pathParts[dIndex + 1];
      
      // Valider le format de l'ID (validation basique)
      if (!sheetId || sheetId.length < 10) {
        return { id: null, error: 'Invalid sheet ID format' };
      }

      // Nettoyer l'ID
      const sanitizedId = inputSanitizationService.sanitizeText(sheetId);
      
      return { id: sanitizedId };
    } catch (error) {
      return { id: null, error: 'Failed to extract sheet ID' };
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
