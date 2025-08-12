// Service de validation et correction des réponses IA

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedContent?: {
    titles: string[];
    descriptions: string[];
  };
}

export interface ValidationRules {
  maxTitleLength: number;
  maxDescriptionLength: number;
  minDescriptionLength: number;
  requiredTitlesCount: number;
  requiredDescriptionsCount: number;
  strictValidation: boolean;
}

export class ResponseValidator {
  private static readonly DEFAULT_RULES: ValidationRules = {
    maxTitleLength: 30,
    maxDescriptionLength: 90,
    minDescriptionLength: 55,
    requiredTitlesCount: 15,
    requiredDescriptionsCount: 4,
    strictValidation: true
  };

  /**
   * Valide et corrige une réponse IA
   */
  static validateAndCorrect(
    content: string, 
    rules: Partial<ValidationRules> = {}
  ): ValidationResult {
    const validationRules = { ...this.DEFAULT_RULES, ...rules };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Extraction du JSON depuis la réponse
      const jsonContent = this.extractJSON(content);
      if (!jsonContent) {
        result.isValid = false;
        result.errors.push("Aucun JSON valide trouvé dans la réponse");
        return result;
      }

      // Validation de la structure
      const structureValidation = this.validateStructure(jsonContent, validationRules);
      result.errors.push(...structureValidation.errors);
      result.warnings.push(...structureValidation.warnings);

      // Correction automatique si possible
      if (structureValidation.canCorrect) {
        result.correctedContent = this.autoCorrect(jsonContent, validationRules);
        if (result.errors.length > 0) {
          result.warnings.push("Contenu corrigé automatiquement");
        }
      }

      result.isValid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Erreur lors de la validation: ${error}`);
      return result;
    }
  }

  /**
   * Extrait le JSON depuis une réponse texte
   */
  private static extractJSON(content: string): any {
    if (!content) return null;

    try {
      // Recherche directe de JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Nettoyage du contenu pour extraire le JSON
      const cleanContent = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*[\w\s]*?(?=\{)/g, '')
        .replace(/\}[\s\S]*$/g, '}')
        .trim();

      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Erreur extraction JSON:', error);
      return null;
    }
  }

  /**
   * Valide la structure du contenu JSON
   */
  private static validateStructure(
    jsonContent: any, 
    rules: ValidationRules
  ): { errors: string[]; warnings: string[]; canCorrect: boolean } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let canCorrect = true;

    // Vérification de la structure de base
    if (!jsonContent.titles || !Array.isArray(jsonContent.titles)) {
      errors.push("Structure 'titles' manquante ou invalide");
      canCorrect = false;
    }

    if (!jsonContent.descriptions || !Array.isArray(jsonContent.descriptions)) {
      errors.push("Structure 'descriptions' manquante ou invalide");
      canCorrect = false;
    }

    if (!canCorrect) return { errors, warnings, canCorrect };

    // Validation des titres
    const titleValidation = this.validateTitles(jsonContent.titles, rules);
    errors.push(...titleValidation.errors);
    warnings.push(...titleValidation.warnings);

    // Validation des descriptions
    const descValidation = this.validateDescriptions(jsonContent.descriptions, rules);
    errors.push(...descValidation.errors);
    warnings.push(...descValidation.warnings);

    return { errors, warnings, canCorrect };
  }

  /**
   * Valide les titres
   */
  private static validateTitles(
    titles: string[], 
    rules: ValidationRules
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification du nombre
    if (titles.length !== rules.requiredTitlesCount) {
      if (rules.strictValidation) {
        errors.push(`Nombre de titres incorrect: ${titles.length} au lieu de ${rules.requiredTitlesCount}`);
      } else {
        warnings.push(`Nombre de titres: ${titles.length} (attendu: ${rules.requiredTitlesCount})`);
      }
    }

    // Vérification de chaque titre
    titles.forEach((title, index) => {
      if (!title || typeof title !== 'string') {
        errors.push(`Titre ${index + 1}: contenu invalide`);
        return;
      }

      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        errors.push(`Titre ${index + 1}: vide`);
        return;
      }

      if (trimmedTitle.length > rules.maxTitleLength) {
        if (rules.strictValidation) {
          errors.push(`Titre ${index + 1}: ${trimmedTitle.length} caractères (max: ${rules.maxTitleLength})`);
        } else {
          warnings.push(`Titre ${index + 1}: trop long (${trimmedTitle.length} car.)`);
        }
      }
    });

    // Vérification des doublons
    const uniqueTitles = new Set(titles.map(t => t?.trim().toLowerCase()));
    if (uniqueTitles.size !== titles.length) {
      warnings.push("Doublons détectés dans les titres");
    }

    return { errors, warnings };
  }

  /**
   * Valide les descriptions
   */
  private static validateDescriptions(
    descriptions: string[], 
    rules: ValidationRules
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification du nombre
    if (descriptions.length !== rules.requiredDescriptionsCount) {
      if (rules.strictValidation) {
        errors.push(`Nombre de descriptions incorrect: ${descriptions.length} au lieu de ${rules.requiredDescriptionsCount}`);
      } else {
        warnings.push(`Nombre de descriptions: ${descriptions.length} (attendu: ${rules.requiredDescriptionsCount})`);
      }
    }

    // Vérification de chaque description
    descriptions.forEach((description, index) => {
      if (!description || typeof description !== 'string') {
        errors.push(`Description ${index + 1}: contenu invalide`);
        return;
      }

      const trimmedDesc = description.trim();
      if (trimmedDesc.length === 0) {
        errors.push(`Description ${index + 1}: vide`);
        return;
      }

      if (trimmedDesc.length > rules.maxDescriptionLength) {
        if (rules.strictValidation) {
          errors.push(`Description ${index + 1}: ${trimmedDesc.length} caractères (max: ${rules.maxDescriptionLength})`);
        } else {
          warnings.push(`Description ${index + 1}: trop longue (${trimmedDesc.length} car.)`);
        }
      }

      if (trimmedDesc.length < rules.minDescriptionLength) {
        warnings.push(`Description ${index + 1}: courte (${trimmedDesc.length} car.)`);
      }
    });

    return { errors, warnings };
  }

  /**
   * Correction automatique du contenu
   */
  private static autoCorrect(
    jsonContent: any, 
    rules: ValidationRules
  ): { titles: string[]; descriptions: string[] } {
    const correctedTitles = this.correctTitles(jsonContent.titles || [], rules);
    const correctedDescriptions = this.correctDescriptions(jsonContent.descriptions || [], rules);

    return {
      titles: correctedTitles,
      descriptions: correctedDescriptions
    };
  }

  /**
   * Corrige les titres
   */
  private static correctTitles(titles: string[], rules: ValidationRules): string[] {
    let corrected = titles
      .filter(title => title && typeof title === 'string')
      .map(title => title.trim())
      .filter(title => title.length > 0)
      .map(title => title.length > rules.maxTitleLength 
        ? title.substring(0, rules.maxTitleLength).trim()
        : title
      );

    // Suppression des doublons
    corrected = Array.from(new Set(corrected));

    // Ajustement du nombre si nécessaire
    if (corrected.length > rules.requiredTitlesCount) {
      corrected = corrected.slice(0, rules.requiredTitlesCount);
    }

    return corrected;
  }

  /**
   * Corrige les descriptions
   */
  private static correctDescriptions(descriptions: string[], rules: ValidationRules): string[] {
    let corrected = descriptions
      .filter(desc => desc && typeof desc === 'string')
      .map(desc => desc.trim())
      .filter(desc => desc.length > 0)
      .map(desc => desc.length > rules.maxDescriptionLength 
        ? desc.substring(0, rules.maxDescriptionLength).trim()
        : desc
      );

    // Ajustement du nombre si nécessaire
    if (corrected.length > rules.requiredDescriptionsCount) {
      corrected = corrected.slice(0, rules.requiredDescriptionsCount);
    }

    return corrected;
  }

  /**
   * Génère un rapport de validation lisible
   */
  static generateValidationReport(result: ValidationResult): string {
    const lines: string[] = [];

    if (result.isValid) {
      lines.push("✅ Validation réussie");
    } else {
      lines.push("❌ Validation échouée");
    }

    if (result.errors.length > 0) {
      lines.push("\n🔴 Erreurs:");
      result.errors.forEach(error => lines.push(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      lines.push("\n🟡 Avertissements:");
      result.warnings.forEach(warning => lines.push(`  - ${warning}`));
    }

    if (result.correctedContent) {
      lines.push("\n🔧 Contenu corrigé automatiquement");
    }

    return lines.join('\n');
  }
}