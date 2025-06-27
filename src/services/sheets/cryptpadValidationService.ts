
import { inputSanitizationService } from "../security/inputSanitizationService";

export interface CryptpadValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
  securityWarnings?: string[];
}

class CryptpadValidationService {
  private readonly ALLOWED_DOMAINS = [
    'cryptpad.fr',
    'cryptpad.org', 
    'cryptpad.io'
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
   * Comprehensive validation of CryptPad URLs with security checks
   */
  validateCryptpadUrl(url: string): CryptpadValidationResult {
    const warnings: string[] = [];
    
    // Basic validation
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'URL is required and must be a string'
      };
    }

    // Check for suspicious patterns
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

    // Sanitize URL
    const sanitizedUrl = url.replace(/[<>'"]/g, '').trim();
    
    // Length validation
    if (sanitizedUrl.length > 2000) {
      return {
        isValid: false,
        error: 'URL is too long (max 2000 characters)',
        securityWarnings: warnings
      };
    }

    try {
      const urlObj = new URL(sanitizedUrl);
      
      // Protocol validation
      if (urlObj.protocol !== 'https:') {
        warnings.push('Non-HTTPS URL detected');
        return {
          isValid: false,
          error: 'Only HTTPS URLs are allowed',
          securityWarnings: warnings
        };
      }

      // Domain validation
      const isValidDomain = this.ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isValidDomain) {
        warnings.push('Non-whitelisted domain');
        return {
          isValid: false,
          error: 'URL must be from a valid CryptPad domain',
          securityWarnings: warnings
        };
      }

      // Path validation
      if (!urlObj.pathname.includes('/sheet/')) {
        return {
          isValid: false,
          error: 'URL must be a CryptPad sheet',
          securityWarnings: warnings
        };
      }

      // Additional security checks
      if (urlObj.pathname.includes('..')) {
        warnings.push('Path traversal attempt detected');
        return {
          isValid: false,
          error: 'Invalid path in URL',
          securityWarnings: warnings
        };
      }

      // Check for suspicious query parameters
      const suspiciousParams = ['eval', 'script', 'javascript', 'onclick', 'onerror'];
      for (const [key, value] of urlObj.searchParams) {
        if (suspiciousParams.some(param => 
          key.toLowerCase().includes(param) || 
          value.toLowerCase().includes(param)
        )) {
          warnings.push('Suspicious query parameters detected');
          return {
            isValid: false,
            error: 'URL contains potentially dangerous parameters',
            securityWarnings: warnings
          };
        }
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
   * Extract and validate CryptPad ID from URL
   */
  extractCryptpadId(url: string): { id: string | null; error?: string } {
    const validation = this.validateCryptpadUrl(url);
    
    if (!validation.isValid) {
      return { id: null, error: validation.error };
    }

    try {
      const urlObj = new URL(validation.sanitizedUrl!);
      const pathParts = urlObj.pathname.split('/');
      const sheetIndex = pathParts.indexOf('sheet');
      
      if (sheetIndex === -1 || sheetIndex >= pathParts.length - 1) {
        return { id: null, error: 'Could not extract sheet ID from URL' };
      }

      const sheetId = pathParts[sheetIndex + 1];
      
      // Validate sheet ID format (basic validation)
      if (!sheetId || sheetId.length < 10) {
        return { id: null, error: 'Invalid sheet ID format' };
      }

      // Sanitize sheet ID
      const sanitizedId = inputSanitizationService.sanitizeText(sheetId);
      
      return { id: sanitizedId };
    } catch (error) {
      return { id: null, error: 'Failed to extract sheet ID' };
    }
  }

  /**
   * Validate sheet data structure for security
   */
  validateSheetData(data: any): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid data format' };
    }

    // Check data size (prevent DoS)
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 10 * 1024 * 1024) { // 10MB limit
      return { isValid: false, error: 'Data too large' };
    }

    // Validate content array
    if (data.content && Array.isArray(data.content)) {
      // Limit number of rows/columns
      if (data.content.length > 10000) {
        return { isValid: false, error: 'Too many rows in sheet data' };
      }

      for (const row of data.content) {
        if (Array.isArray(row) && row.length > 1000) {
          return { isValid: false, error: 'Too many columns in sheet data' };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, details: any = {}) {
    console.log(`🔒 CryptPad Security Event: ${event}`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

export const cryptpadValidationService = new CryptpadValidationService();
