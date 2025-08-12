// Validateur unifié - Remplace la validation dispersée
// Validation centralisée avec correction automatique et scoring

import { 
  ValidationResult, ValidationError, ValidationWarning, 
  GeneratedContent, LIMITS 
} from '@/types/unified';
import { Logger } from './Logger';

interface ValidationRules {
  strictMode: boolean;
  autoCorrect: boolean;
  qualityThreshold: number;
  allowPartialResults: boolean;
}

export class Validator {
  private logger = new Logger('Validator');
  private static readonly DEFAULT_RULES: ValidationRules = {
    strictMode: true,
    autoCorrect: true,
    qualityThreshold: 0.7,
    allowPartialResults: false
  };

  // ==================== MAIN VALIDATION ====================

  async validateContent(
    rawContent: string, 
    rules: Partial<ValidationRules> = {}
  ): Promise<ValidationResult> {
    const validationRules = { ...Validator.DEFAULT_RULES, ...rules };
    const startTime = Date.now();
    
    try {
      // Step 1: Extract and parse JSON
      const parsedData = this.extractAndParseJSON(rawContent);
      if (!parsedData) {
        return this.createFailureResult('INVALID_JSON', 'No valid JSON found in response');
      }

      // Step 2: Structure validation
      const structureErrors = this.validateStructure(parsedData);
      
      // Step 3: Content validation
      const contentValidation = this.validateContentQuality(parsedData);
      
      // Step 4: Technical constraints
      const constraintValidation = this.validateConstraints(parsedData);

      // Combine all results
      const allErrors = [...structureErrors, ...contentValidation.errors, ...constraintValidation.errors];
      const allWarnings = [...contentValidation.warnings, ...constraintValidation.warnings];

      // Step 5: Auto-correction if enabled
      let correctedContent: GeneratedContent | undefined;
      if (validationRules.autoCorrect && allErrors.length > 0) {
        correctedContent = this.autoCorrectContent(parsedData, allErrors);
      }

      // Step 6: Calculate quality score
      const score = this.calculateQualityScore(parsedData, allErrors, allWarnings);

      const isValid = allErrors.length === 0 || (correctedContent && validationRules.allowPartialResults);

      const result: ValidationResult = {
        isValid,
        score,
        errors: allErrors,
        warnings: allWarnings,
        correctedContent,
        suggestions: this.generateSuggestions(allErrors, allWarnings)
      };

      this.logger.logPerformance('Content validation', Date.now() - startTime, {
        isValid,
        score,
        errorsCount: allErrors.length,
        warningsCount: allWarnings.length,
        corrected: !!correctedContent
      });

      return result;

    } catch (error) {
      this.logger.error('Validation failed', { error: error.message, rawContent: rawContent.substring(0, 200) });
      return this.createFailureResult('VALIDATION_ERROR', `Validation error: ${error.message}`);
    }
  }

  // ==================== JSON EXTRACTION ====================

  private extractAndParseJSON(content: string): any {
    if (!content || typeof content !== 'string') {
      return null;
    }

    try {
      // Try direct parsing first
      return JSON.parse(content);
    } catch {
      // Extract JSON from mixed content
      const patterns = [
        /\{[\s\S]*"titles"[\s\S]*"descriptions"[\s\S]*\}/,
        /\{[\s\S]*\}/,
        /```json\s*(\{[\s\S]*?\})\s*```/,
        /```(\{[\s\S]*?\})```/
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            const jsonStr = match[1] || match[0];
            return JSON.parse(jsonStr.trim());
          } catch {
            continue;
          }
        }
      }
    }

    return null;
  }

  // ==================== STRUCTURE VALIDATION ====================

  private validateStructure(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
      errors.push(this.createError('structure', 'title', 'Data is not an object'));
      return errors;
    }

    // Check required fields
    if (!Array.isArray(data.titles)) {
      errors.push(this.createError('structure', 'title', 'Missing or invalid titles array'));
    }

    if (!Array.isArray(data.descriptions)) {
      errors.push(this.createError('structure', 'description', 'Missing or invalid descriptions array'));
    }

    return errors;
  }

  // ==================== CONTENT VALIDATION ====================

  private validateContentQuality(data: any): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate titles
    if (Array.isArray(data.titles)) {
      data.titles.forEach((title: any, index: number) => {
        const titleValidation = this.validateTitle(title, index);
        errors.push(...titleValidation.errors);
        warnings.push(...titleValidation.warnings);
      });

      // Check for duplicates
      const uniqueTitles = new Set(data.titles.map((t: string) => t?.toLowerCase().trim()));
      if (uniqueTitles.size !== data.titles.length) {
        warnings.push(this.createWarning('quality', 'Duplicate titles detected'));
      }
    }

    // Validate descriptions
    if (Array.isArray(data.descriptions)) {
      data.descriptions.forEach((description: any, index: number) => {
        const descValidation = this.validateDescription(description, index);
        errors.push(...descValidation.errors);
        warnings.push(...descValidation.warnings);
      });

      // Check for duplicates
      const uniqueDescs = new Set(data.descriptions.map((d: string) => d?.toLowerCase().trim()));
      if (uniqueDescs.size !== data.descriptions.length) {
        warnings.push(this.createWarning('quality', 'Duplicate descriptions detected'));
      }
    }

    return { errors, warnings };
  }

  // ==================== CONSTRAINT VALIDATION ====================

  private validateConstraints(data: any): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Count validation
    if (Array.isArray(data.titles)) {
      if (data.titles.length !== LIMITS.REQUIRED_TITLES_COUNT) {
        errors.push(this.createError('length', 'title', 
          `Wrong count: ${data.titles.length} instead of ${LIMITS.REQUIRED_TITLES_COUNT}`));
      }
    }

    if (Array.isArray(data.descriptions)) {
      if (data.descriptions.length !== LIMITS.REQUIRED_DESCRIPTIONS_COUNT) {
        errors.push(this.createError('length', 'description', 
          `Wrong count: ${data.descriptions.length} instead of ${LIMITS.REQUIRED_DESCRIPTIONS_COUNT}`));
      }
    }

    return { errors, warnings };
  }

  // ==================== INDIVIDUAL ITEM VALIDATION ====================

  private validateTitle(title: any, index: number): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!title || typeof title !== 'string') {
      errors.push(this.createError('content', 'title', 'Title is empty or not a string', index));
      return { errors, warnings };
    }

    const trimmedTitle = title.trim();
    
    if (trimmedTitle.length === 0) {
      errors.push(this.createError('content', 'title', 'Title is empty', index));
    } else if (trimmedTitle.length > LIMITS.TITLE_MAX_LENGTH) {
      errors.push(this.createError('length', 'title', 
        `Title too long: ${trimmedTitle.length} chars (max: ${LIMITS.TITLE_MAX_LENGTH})`, index, title));
    }

    // Quality checks
    if (trimmedTitle.length < 10) {
      warnings.push(this.createWarning('quality', `Title ${index + 1} is very short`));
    }

    if (!/[a-zA-Z]/.test(trimmedTitle)) {
      warnings.push(this.createWarning('quality', `Title ${index + 1} has no letters`));
    }

    return { errors, warnings };
  }

  private validateDescription(description: any, index: number): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!description || typeof description !== 'string') {
      errors.push(this.createError('content', 'description', 'Description is empty or not a string', index));
      return { errors, warnings };
    }

    const trimmedDesc = description.trim();
    
    if (trimmedDesc.length === 0) {
      errors.push(this.createError('content', 'description', 'Description is empty', index));
    } else if (trimmedDesc.length > LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.push(this.createError('length', 'description', 
        `Description too long: ${trimmedDesc.length} chars (max: ${LIMITS.DESCRIPTION_MAX_LENGTH})`, index, description));
    } else if (trimmedDesc.length < LIMITS.DESCRIPTION_MIN_LENGTH) {
      warnings.push(this.createWarning('quality', 
        `Description ${index + 1} is short: ${trimmedDesc.length} chars (recommended: ${LIMITS.DESCRIPTION_MIN_LENGTH}+)`));
    }

    // Check for call-to-action
    const ctaWords = ['découvrez', 'profitez', 'contactez', 'demandez', 'réservez', 'achetez', 'commandez'];
    const hasCTA = ctaWords.some(word => trimmedDesc.toLowerCase().includes(word));
    if (!hasCTA) {
      warnings.push(this.createWarning('quality', `Description ${index + 1} may lack a clear call-to-action`));
    }

    return { errors, warnings };
  }

  // ==================== AUTO-CORRECTION ====================

  private autoCorrectContent(data: any, errors: ValidationError[]): GeneratedContent | undefined {
    try {
      const corrected = { ...data };

      // Fix titles
      if (Array.isArray(corrected.titles)) {
        corrected.titles = corrected.titles
          .filter((title: any) => title && typeof title === 'string')
          .map((title: string) => title.trim())
          .filter((title: string) => title.length > 0)
          .map((title: string) => title.length > LIMITS.TITLE_MAX_LENGTH 
            ? title.substring(0, LIMITS.TITLE_MAX_LENGTH).trim()
            : title)
          .slice(0, LIMITS.REQUIRED_TITLES_COUNT);

        // Remove duplicates
        corrected.titles = Array.from(new Set(corrected.titles));
      }

      // Fix descriptions
      if (Array.isArray(corrected.descriptions)) {
        corrected.descriptions = corrected.descriptions
          .filter((desc: any) => desc && typeof desc === 'string')
          .map((desc: string) => desc.trim())
          .filter((desc: string) => desc.length > 0)
          .map((desc: string) => desc.length > LIMITS.DESCRIPTION_MAX_LENGTH 
            ? desc.substring(0, LIMITS.DESCRIPTION_MAX_LENGTH).trim()
            : desc)
          .slice(0, LIMITS.REQUIRED_DESCRIPTIONS_COUNT);

        // Remove duplicates
        corrected.descriptions = Array.from(new Set(corrected.descriptions));
      }

      return {
        titles: corrected.titles || [],
        descriptions: corrected.descriptions || [],
        metadata: {
          model: 'corrected',
          promptId: 'auto-corrected',
          industry: 'unknown',
          timestamp: new Date().toISOString(),
          validationScore: 0.5,
          processingTime: 0,
          retryCount: 0
        }
      };

    } catch (error) {
      this.logger.error('Auto-correction failed', { error: error.message });
      return undefined;
    }
  }

  // ==================== QUALITY SCORING ====================

  private calculateQualityScore(data: any, errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 1.0;

    // Deduct for errors
    errors.forEach(error => {
      switch (error.type) {
        case 'structure':
          score -= 0.3;
          break;
        case 'length':
          score -= 0.1;
          break;
        case 'content':
          score -= 0.2;
          break;
        case 'format':
          score -= 0.05;
          break;
      }
    });

    // Deduct for warnings
    warnings.forEach(warning => {
      score -= 0.02;
    });

    // Bonus for good structure
    if (Array.isArray(data.titles) && Array.isArray(data.descriptions)) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  // ==================== SUGGESTIONS ====================

  private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];

    if (errors.some(e => e.type === 'length')) {
      suggestions.push('Consider shorter, more impactful phrases');
    }

    if (warnings.some(w => w.message.includes('call-to-action'))) {
      suggestions.push('Add clear calls-to-action like "Découvrez", "Contactez", "Profitez"');
    }

    if (errors.some(e => e.message.includes('duplicate'))) {
      suggestions.push('Ensure all titles and descriptions are unique');
    }

    if (errors.some(e => e.type === 'structure')) {
      suggestions.push('Verify the JSON format matches the required structure');
    }

    return suggestions;
  }

  // ==================== HELPERS ====================

  private createError(
    type: ValidationError['type'], 
    field: ValidationError['field'], 
    message: string, 
    index?: number,
    value?: string
  ): ValidationError {
    return { type, field, message, index, value };
  }

  private createWarning(type: ValidationWarning['type'], message: string): ValidationWarning {
    return { type, message };
  }

  private createFailureResult(code: string, message: string): ValidationResult {
    return {
      isValid: false,
      score: 0,
      errors: [this.createError('structure', 'title', message)],
      warnings: []
    };
  }

  // ==================== PUBLIC UTILITIES ====================

  static validateQuickly(content: string): boolean {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data.titles) && Array.isArray(data.descriptions);
    } catch {
      return false;
    }
  }

  static extractTitlesAndDescriptions(content: string): { titles: string[]; descriptions: string[] } {
    const validator = new Validator();
    const data = validator.extractAndParseJSON(content);
    
    return {
      titles: Array.isArray(data?.titles) ? data.titles : [],
      descriptions: Array.isArray(data?.descriptions) ? data.descriptions : []
    };
  }
}