import { toast } from "@/hooks/use-toast";

export interface EditorialConstraints {
  forbiddenTerms: string[];
  forbiddenPhrases: string[];
  forbiddenTones: string[];
  mandatoryTerms: string[];
  constraintPriority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConstraintConflict {
  type: 'term' | 'phrase' | 'tone' | 'style';
  conflictItem: string;
  source: 'industry_template' | 'mandatory_term' | 'tone_conflict';
  suggestion: string;
}

export interface ConstraintValidationResult {
  isValid: boolean;
  conflicts: ConstraintConflict[];
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class EditorialConstraintsService {
  private static instance: EditorialConstraintsService;

  static getInstance(): EditorialConstraintsService {
    if (!this.instance) {
      this.instance = new EditorialConstraintsService();
    }
    return this.instance;
  }

  /**
   * Parse editorial guidelines text to extract DO/DON'T constraints
   */
  parseEditorialGuidelines(guidelines: string): Partial<EditorialConstraints> {
    const result: Partial<EditorialConstraints> = {
      forbiddenTerms: [],
      forbiddenPhrases: [],
      forbiddenTones: [],
      mandatoryTerms: []
    };

    if (!guidelines) return result;

    const lines = guidelines.toLowerCase().split('\n');
    let currentSection: 'forbidden' | 'mandatory' | null = null;

    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Detect sections
      if (cleanLine.includes("don't") || cleanLine.includes("ne pas") || cleanLine.includes("interdit")) {
        currentSection = 'forbidden';
        continue;
      }
      
      if (cleanLine.includes("do:") || cleanLine.includes("à faire") || cleanLine.includes("recommandé")) {
        currentSection = 'mandatory';
        continue;
      }

      // Extract items from current section
      if (currentSection && cleanLine.length > 2) {
        const items = this.extractItemsFromLine(cleanLine);
        
        if (currentSection === 'forbidden') {
          // Categorize forbidden items
          items.forEach(item => {
            if (this.isToneDescriptor(item)) {
              result.forbiddenTones!.push(item);
            } else if (item.includes(' ') && item.length > 10) {
              result.forbiddenPhrases!.push(item);
            } else {
              result.forbiddenTerms!.push(item);
            }
          });
        } else if (currentSection === 'mandatory') {
          result.mandatoryTerms!.push(...items);
        }
      }
    }

    return result;
  }

  /**
   * Extract individual items from a guideline line
   */
  private extractItemsFromLine(line: string): string[] {
    const items: string[] = [];
    
    // Remove common prefixes
    const cleanLine = line
      .replace(/^[-•*]\s*/, '')
      .replace(/^(ne pas|avoid|éviter|interdit)/i, '')
      .trim();

    // Split by common separators
    const segments = cleanLine.split(/[,;:|]/).map(s => s.trim()).filter(s => s.length > 1);
    
    for (const segment of segments) {
      // Remove quotes
      const clean = segment.replace(/['"«»]/g, '').trim();
      if (clean.length > 1) {
        items.push(clean);
      }
    }

    return items;
  }

  /**
   * Determine if a term describes a tone/style
   */
  private isToneDescriptor(term: string): boolean {
    const toneKeywords = [
      'familier', 'promotional', 'marketing', 'technique', 'professionnel',
      'humour', 'casual', 'formal', 'premium', 'luxe', 'cheap', 'bas de gamme'
    ];
    
    return toneKeywords.some(keyword => term.includes(keyword));
  }

  /**
   * Validate constraints against industry templates and detect conflicts
   */
  validateConstraints(
    constraints: EditorialConstraints,
    industryConfig: any,
    existingPrompt: string
  ): ConstraintValidationResult {
    const conflicts: ConstraintConflict[] = [];
    const suggestions: string[] = [];

    // Check for conflicts between forbidden terms and industry recommendations
    if (industryConfig?.keywords) {
      for (const industryKeyword of industryConfig.keywords) {
        if (constraints.forbiddenTerms.some(forbidden => 
          forbidden.toLowerCase().includes(industryKeyword.toLowerCase())
        )) {
          conflicts.push({
            type: 'term',
            conflictItem: industryKeyword,
            source: 'industry_template',
            suggestion: `Le terme "${industryKeyword}" est recommandé pour votre secteur mais figure dans vos interdictions`
          });
        }
      }
    }

    // Check for conflicts between forbidden and mandatory terms
    for (const mandatoryTerm of constraints.mandatoryTerms) {
      if (constraints.forbiddenTerms.some(forbidden => 
        forbidden.toLowerCase().includes(mandatoryTerm.toLowerCase())
      )) {
        conflicts.push({
          type: 'term',
          conflictItem: mandatoryTerm,
          source: 'mandatory_term',
          suggestion: `"${mandatoryTerm}" est à la fois obligatoire et interdit`
        });
      }
    }

    // Check tone conflicts
    if (industryConfig?.tone && constraints.forbiddenTones.includes(industryConfig.tone)) {
      conflicts.push({
        type: 'tone',
        conflictItem: industryConfig.tone,
        source: 'tone_conflict',
        suggestion: `Le ton "${industryConfig.tone}" est recommandé pour votre secteur mais interdit dans vos contraintes`
      });
    }

    // Generate suggestions
    if (conflicts.length > 0) {
      suggestions.push("Résolvez les conflits détectés pour optimiser la génération");
    }

    if (constraints.forbiddenTerms.length > 20) {
      suggestions.push("Considérez regrouper les termes similaires pour simplifier les contraintes");
    }

    const severity = this.calculateSeverity(conflicts, constraints.constraintPriority);

    return {
      isValid: conflicts.length === 0,
      conflicts,
      suggestions,
      severity
    };
  }

  /**
   * Calculate conflict severity
   */
  private calculateSeverity(
    conflicts: ConstraintConflict[], 
    priority: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (conflicts.length === 0) return 'low';
    
    const criticalConflicts = conflicts.filter(c => 
      c.source === 'mandatory_term' || c.type === 'tone'
    ).length;

    if (priority === 'critical' && criticalConflicts > 0) return 'critical';
    if (criticalConflicts > 2 || priority === 'high') return 'high';
    if (conflicts.length > 3 || priority === 'medium') return 'medium';
    
    return 'low';
  }

  /**
   * Generate constraint section for prompt
   */
  generateConstraintPromptSection(constraints: EditorialConstraints): string {
    let section = "\n## CONTRAINTES ÉDITORIALES ABSOLUES\n";
    
    if (constraints.constraintPriority === 'critical') {
      section += "⚠️ PRIORITY CRITIQUE - ZÉRO TOLÉRANCE\n";
    }

    if (constraints.forbiddenTerms.length > 0) {
      section += `\n### MOTS INTERDITS (${constraints.forbiddenTerms.length}) :\n`;
      section += `${constraints.forbiddenTerms.map(term => `"${term}"`).join(', ')}\n`;
    }

    if (constraints.forbiddenPhrases.length > 0) {
      section += `\n### EXPRESSIONS INTERDITES (${constraints.forbiddenPhrases.length}) :\n`;
      section += `${constraints.forbiddenPhrases.map(phrase => `"${phrase}"`).join(', ')}\n`;
    }

    if (constraints.forbiddenTones.length > 0) {
      section += `\n### TONS PROSCRITS :\n`;
      section += `${constraints.forbiddenTones.join(', ')}\n`;
    }

    if (constraints.mandatoryTerms.length > 0) {
      section += `\n### TERMES À PRIVILÉGIER :\n`;
      section += `${constraints.mandatoryTerms.join(', ')}\n`;
    }

    section += `\n### INSTRUCTIONS DE VALIDATION :\n`;
    section += `- Scanner CHAQUE mot généré contre la liste d'interdictions\n`;
    section += `- Si un terme interdit est détecté, REFORMULER IMMÉDIATEMENT\n`;
    section += `- Intégrer naturellement les termes privilégiés quand pertinent\n`;
    section += `- Niveau de priorité : ${constraints.constraintPriority.toUpperCase()}\n`;

    return section;
  }

  /**
   * Validate generated content against constraints
   */
  validateGeneratedContent(content: string, constraints: EditorialConstraints): {
    isValid: boolean;
    violations: string[];
    score: number;
  } {
    const violations: string[] = [];
    const contentLower = content.toLowerCase();

    // Check forbidden terms
    for (const term of constraints.forbiddenTerms) {
      if (contentLower.includes(term.toLowerCase())) {
        violations.push(`Terme interdit détecté: "${term}"`);
      }
    }

    // Check forbidden phrases
    for (const phrase of constraints.forbiddenPhrases) {
      if (contentLower.includes(phrase.toLowerCase())) {
        violations.push(`Expression interdite détectée: "${phrase}"`);
      }
    }

    // Calculate compliance score
    const totalConstraints = constraints.forbiddenTerms.length + constraints.forbiddenPhrases.length;
    const score = totalConstraints > 0 ? Math.max(0, 100 - (violations.length / totalConstraints) * 100) : 100;

    return {
      isValid: violations.length === 0,
      violations,
      score: Math.round(score)
    };
  }

  /**
   * Get suggested forbidden terms based on industry
   */
  getSuggestedForbiddenTerms(industry: string): string[] {
    const suggestions: Record<string, string[]> = {
      'ecommerce': ['pas cher', 'promo', 'soldes', 'discount', 'braderie'],
      'luxury': ['bon marché', 'économique', 'abordable', 'discount', 'promo'],
      'btp': ['bricolage', 'amateur', 'approximatif', 'bon marché'],
      'sante': ['miracle', 'guérison', 'remède', 'traitement garanti'],
      'finance': ['sans risque', 'gain garanti', 'facile', 'rapide'],
      'formation': ['diplôme garanti', 'sans effort', 'miracle', 'secret']
    };

    return suggestions[industry] || [];
  }

  /**
   * Export constraints for external use
   */
  exportConstraints(constraints: EditorialConstraints): string {
    return JSON.stringify({
      ...constraints,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import constraints from JSON
   */
  importConstraints(jsonString: string): EditorialConstraints | null {
    try {
      const imported = JSON.parse(jsonString);
      
      // Validate structure
      if (!imported.forbiddenTerms || !Array.isArray(imported.forbiddenTerms)) {
        throw new Error('Format invalide');
      }

      return {
        forbiddenTerms: imported.forbiddenTerms || [],
        forbiddenPhrases: imported.forbiddenPhrases || [],
        forbiddenTones: imported.forbiddenTones || [],
        mandatoryTerms: imported.mandatoryTerms || [],
        constraintPriority: imported.constraintPriority || 'high'
      };
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Format de fichier invalide",
        variant: "destructive"
      });
      return null;
    }
  }
}