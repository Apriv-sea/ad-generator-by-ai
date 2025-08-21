import { AppError, APIError, ValidationError } from '@/types/strict';
import { Logger } from '@/utils/logger';

/**
 * Service de gestion d'erreur standardisé
 * Remplace la gestion d'erreur inconsistante dans l'app
 */
export class ErrorService {
  
  /**
   * Crée une erreur d'application standardisée
   */
  static createAppError(
    code: string, 
    message: string, 
    details?: Record<string, unknown>,
    context?: string
  ): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      context,
      userId: this.getCurrentUserId()
    };
  }

  /**
   * Crée une erreur de validation
   */
  static createValidationError(
    field: string,
    value: unknown,
    rule: string,
    message: string
  ): ValidationError {
    return {
      ...this.createAppError('VALIDATION_ERROR', message),
      field,
      value,
      rule
    };
  }

  /**
   * Crée une erreur d'API
   */
  static createAPIError(
    endpoint: string,
    method: string,
    status: number,
    message: string,
    provider?: string
  ): APIError {
    return {
      ...this.createAppError('API_ERROR', message),
      endpoint,
      method,
      status,
      provider
    };
  }

  /**
   * Gère une erreur de manière standardisée
   */
  static handleError(error: unknown, context?: string): AppError {
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = error;
    } else if (error instanceof Error) {
      appError = this.createAppError(
        'UNKNOWN_ERROR',
        error.message,
        { stack: error.stack },
        context
      );
    } else {
      appError = this.createAppError(
        'UNKNOWN_ERROR',
        'Une erreur inconnue s\'est produite',
        { originalError: error },
        context
      );
    }

    // Log l'erreur
    Logger.error(`[${appError.code}] ${appError.message}`, appError.details);

    return appError;
  }

  /**
   * Wrapper pour les fonctions async avec gestion d'erreur
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<{ data: T; error: null } | { data: null; error: AppError }> {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (error) {
      const appError = this.handleError(error, context);
      return { data: null, error: appError };
    }
  }

  /**
   * Wrapper pour les fonctions sync avec gestion d'erreur
   */
  static safeSync<T>(
    operation: () => T,
    context?: string
  ): { data: T; error: null } | { data: null; error: AppError } {
    try {
      const data = operation();
      return { data, error: null };
    } catch (error) {
      const appError = this.handleError(error, context);
      return { data: null, error: appError };
    }
  }

  /**
   * Valide les données avec gestion d'erreur
   */
  static validateData<T>(
    data: unknown,
    validator: (data: unknown) => data is T,
    context?: string
  ): { data: T; error: null } | { data: null; error: ValidationError } {
    try {
      if (validator(data)) {
        return { data, error: null };
      } else {
        const error = this.createValidationError(
          'data',
          data,
          'type_check',
          'Les données ne correspondent pas au type attendu'
        );
        return { data: null, error };
      }
    } catch (error) {
      const appError = this.handleError(error, context);
      const validationError = this.createValidationError(
        'data',
        data,
        'validation',
        appError.message
      );
      return { data: null, error: validationError };
    }
  }

  /**
   * Type guard pour AppError
   */
  private static isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'timestamp' in error
    );
  }

  /**
   * Récupère l'ID utilisateur actuel (si disponible)
   */
  private static getCurrentUserId(): string | undefined {
    try {
      // Récupérer l'ID utilisateur depuis le contexte Supabase
      const user = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user;
      return user?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Extrait un message d'erreur lisible pour l'utilisateur
   */
  static getUserMessage(error: AppError): string {
    const userMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Problème de connexion. Veuillez réessayer.',
      'AUTH_ERROR': 'Erreur d\'authentification. Veuillez vous reconnecter.',
      'VALIDATION_ERROR': 'Les données saisies ne sont pas valides.',
      'API_ERROR': 'Erreur du service. Veuillez réessayer plus tard.',
      'PERMISSION_ERROR': 'Vous n\'avez pas les permissions nécessaires.',
      'NOT_FOUND_ERROR': 'La ressource demandée n\'a pas été trouvée.',
      'RATE_LIMIT_ERROR': 'Trop de requêtes. Veuillez patienter.'
    };

    return userMessages[error.code] || 'Une erreur s\'est produite. Veuillez réessayer.';
  }
}