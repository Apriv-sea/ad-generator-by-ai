import DOMPurify from 'dompurify';

/**
 * Comprehensive input sanitization service
 */
class InputSanitizationService {
  
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Sanitize plain text input
   */
  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate and sanitize campaign data
   */
  sanitizeCampaignData(data: any): any {
    if (!data || typeof data !== 'object') return {};
    
    const sanitized = { ...data };
    
    // Sanitize string fields
    const stringFields = ['name', 'campaignName', 'adGroupName', 'keywords', 'context'];
    stringFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeText(sanitized[field]);
      }
    });

    // Sanitize array fields
    if (sanitized.titles && Array.isArray(sanitized.titles)) {
      sanitized.titles = sanitized.titles.map((title: string) => this.sanitizeText(title));
    }
    
    if (sanitized.descriptions && Array.isArray(sanitized.descriptions)) {
      sanitized.descriptions = sanitized.descriptions.map((desc: string) => this.sanitizeText(desc));
    }

    if (sanitized.finalUrls && Array.isArray(sanitized.finalUrls)) {
      sanitized.finalUrls = sanitized.finalUrls.map((url: string) => this.sanitizeUrl(url));
    }

    return sanitized;
  }

  /**
   * Validate and sanitize URLs
   */
  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    
    // Remove dangerous protocols
    const sanitized = url.replace(/^(javascript:|data:|vbscript:)/gi, '');
    
    // Basic URL validation
    try {
      new URL(sanitized.startsWith('http') ? sanitized : `https://${sanitized}`);
      return sanitized;
    } catch {
      return '';
    }
  }

  /**
   * Validate CryptPad URL with enhanced security
   */
  validateCryptPadUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    // Remove any potentially dangerous characters
    const sanitizedUrl = url.replace(/[<>'"]/g, '');
    
    // Check for valid CryptPad domains
    const validDomains = [
      'cryptpad.fr',
      'cryptpad.org',
      'cryptpad.io'
    ];
    
    try {
      const urlObj = new URL(sanitizedUrl);
      
      // Check if it's a valid CryptPad domain
      const isValidDomain = validDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isValidDomain) {
        return { 
          isValid: false, 
          error: 'URL must be from a valid CryptPad domain' 
        };
      }
      
      // Check for sheet-like paths
      if (!urlObj.pathname.includes('/sheet/')) {
        return { 
          isValid: false, 
          error: 'URL must be a CryptPad sheet' 
        };
      }
      
      return { isValid: true };
    } catch {
      return { 
        isValid: false, 
        error: 'Invalid URL format' 
      };
    }
  }

  /**
   * Sanitize LLM prompts to prevent injection attacks - SANS limitation de longueur
   */
  sanitizePrompt(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') return '';
    
    return prompt
      .replace(/\b(ignore|forget|disregard)\s+(previous|above|all)\s+(instructions|prompts?|context)/gi, '')
      .replace(/\b(system|admin|root|execute|eval|script)/gi, '')
      .replace(/[<>{}]/g, '')
      .trim();
      // SUPPRESSION de .substring(0, 2000) pour permettre des prompts plus longs
  }

  /**
   * Validate file uploads
   */
  validateFileUpload(file: File): { isValid: boolean; error?: string } {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    return { isValid: true };
  }
}

export const inputSanitizationService = new InputSanitizationService();
