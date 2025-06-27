
export interface SecurityValidationResult {
  isValid: boolean;
  violations: string[];
  risk: 'low' | 'medium' | 'high';
}

export class SecurityValidationService {
  private static readonly SENSITIVE_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\bsk-[a-zA-Z0-9]{48}\b/g, // OpenAI API key pattern
    /\bAIza[0-9A-Za-z-_]{35}\b/g, // Google API key pattern
  ];

  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  static validateUserInput(input: string): SecurityValidationResult {
    const violations: string[] = [];
    let risk: 'low' | 'medium' | 'high' = 'low';

    // Vérifier les données sensibles
    this.SENSITIVE_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        violations.push('Données sensibles détectées');
        risk = 'high';
      }
    });

    // Vérifier XSS
    this.XSS_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        violations.push('Tentative de script malveillant détectée');
        risk = 'high';
      }
    });

    // Vérifier la longueur
    if (input.length > 10000) {
      violations.push('Entrée trop longue');
      // Seulement élever le risque à medium si ce n'est pas déjà high
      if (risk === 'low') {
        risk = 'medium';
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      risk
    };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Supprimer les balises HTML
      .replace(/javascript:/gi, '') // Supprimer javascript:
      .trim();
  }

  static validateApiKey(key: string): boolean {
    if (!key || key.length < 10) return false;
    
    // Ne pas accepter de clés qui semblent être des placeholders
    const invalidKeys = ['your-api-key', 'api-key-here', 'sk-xxxxxxxxx'];
    return !invalidKeys.includes(key.toLowerCase());
  }
}
