
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedContent?: string;
}

export interface ContentLimits {
  titleMaxLength: number;
  descriptionMaxLength: number;
  requiredTitles: number;
  requiredDescriptions: number;
}

class ContentValidationService {
  private readonly defaultLimits: ContentLimits = {
    titleMaxLength: 30,
    descriptionMaxLength: 90,
    requiredTitles: 10,
    requiredDescriptions: 5
  };

  validateTitle(title: string, limits = this.defaultLimits): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Nettoyer le titre
    let cleanedTitle = this.cleanText(title);
    
    // Vérifications
    if (!cleanedTitle.trim()) {
      errors.push("Le titre ne peut pas être vide");
    }
    
    if (cleanedTitle.length > limits.titleMaxLength) {
      errors.push(`Le titre dépasse ${limits.titleMaxLength} caractères (${cleanedTitle.length})`);
      // Tenter de raccourcir intelligemment
      cleanedTitle = this.smartTruncate(cleanedTitle, limits.titleMaxLength);
      warnings.push(`Titre raccourci automatiquement: "${cleanedTitle}"`);
    }
    
    // Vérifications de qualité
    if (cleanedTitle.length < 10) {
      warnings.push("Titre très court, pourrait manquer d'impact");
    }
    
    if (!this.hasCallToAction(cleanedTitle) && !this.hasBenefit(cleanedTitle)) {
      warnings.push("Le titre pourrait bénéficier d'un appel à l'action ou d'un bénéfice");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedContent: cleanedTitle
    };
  }

  validateDescription(description: string, limits = this.defaultLimits): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Nettoyer la description
    let cleanedDescription = this.cleanText(description);
    
    // Vérifications
    if (!cleanedDescription.trim()) {
      errors.push("La description ne peut pas être vide");
    }
    
    if (cleanedDescription.length > limits.descriptionMaxLength) {
      errors.push(`La description dépasse ${limits.descriptionMaxLength} caractères (${cleanedDescription.length})`);
      // Tenter de raccourcir intelligemment
      cleanedDescription = this.smartTruncate(cleanedDescription, limits.descriptionMaxLength);
      warnings.push(`Description raccourcie automatiquement: "${cleanedDescription}"`);
    }
    
    // Vérifications de qualité
    if (!this.hasCallToAction(cleanedDescription)) {
      warnings.push("La description devrait inclure un appel à l'action");
    }
    
    if (cleanedDescription.length < 30) {
      warnings.push("Description courte, pourrait être plus persuasive");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedContent: cleanedDescription
    };
  }

  validateTitlesArray(titles: string[], limits = this.defaultLimits): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanedTitles: string[] = [];
    
    if (titles.length < limits.requiredTitles) {
      errors.push(`Nombre insuffisant de titres: ${titles.length}/${limits.requiredTitles}`);
    }
    
    for (let i = 0; i < titles.length; i++) {
      const result = this.validateTitle(titles[i], limits);
      
      if (result.errors.length > 0) {
        errors.push(`Titre ${i + 1}: ${result.errors.join(', ')}`);
      }
      
      warnings.push(...result.warnings.map(w => `Titre ${i + 1}: ${w}`));
      
      if (result.cleanedContent) {
        cleanedTitles.push(result.cleanedContent);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedContent: cleanedTitles
    };
  }

  validateDescriptionsArray(descriptions: string[], limits = this.defaultLimits): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanedDescriptions: string[] = [];
    
    if (descriptions.length < limits.requiredDescriptions) {
      errors.push(`Nombre insuffisant de descriptions: ${descriptions.length}/${limits.requiredDescriptions}`);
    }
    
    for (let i = 0; i < descriptions.length; i++) {
      const result = this.validateDescription(descriptions[i], limits);
      
      if (result.errors.length > 0) {
        errors.push(`Description ${i + 1}: ${result.errors.join(', ')}`);
      }
      
      warnings.push(...result.warnings.map(w => `Description ${i + 1}: ${w}`));
      
      if (result.cleanedContent) {
        cleanedDescriptions.push(result.cleanedContent);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedContent: cleanedDescriptions
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .replace(/[""'']/g, '"') // Normaliser les guillemets
      .replace(/[–—]/g, '-') // Normaliser les tirets
      .trim();
  }

  private smartTruncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Essayer de couper à un espace près de la limite
    const cutPoint = text.lastIndexOf(' ', maxLength - 3);
    
    if (cutPoint > maxLength * 0.7) {
      return text.substring(0, cutPoint).trim();
    }
    
    // Sinon, couper brutalement
    return text.substring(0, maxLength - 3).trim() + '...';
  }

  private hasCallToAction(text: string): boolean {
    const ctaWords = [
      'découvrez', 'profitez', 'obtenez', 'achetez', 'commandez', 'contactez',
      'appelez', 'cliquez', 'visitez', 'essayez', 'testez', 'demandez',
      'réservez', 'inscrivez', 'téléchargez', 'consultez'
    ];
    
    return ctaWords.some(word => 
      text.toLowerCase().includes(word)
    );
  }

  private hasBenefit(text: string): boolean {
    const benefitWords = [
      'gratuit', 'rapide', 'efficace', 'garanti', 'qualité', 'meilleur',
      'économique', 'professionnel', 'expert', 'premium', 'exclusif',
      'limité', 'nouveau', 'innovant', 'unique'
    ];
    
    return benefitWords.some(word => 
      text.toLowerCase().includes(word)
    );
  }
}

export const contentValidationService = new ContentValidationService();
