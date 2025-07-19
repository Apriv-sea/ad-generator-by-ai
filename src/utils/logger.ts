/**
 * Service de logging optimisé pour la production
 * Remplace tous les console.log/error/warn par des logs conditionnels
 */
export class Logger {
  private static isDevelopment = import.meta.env.DEV;

  static log(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.error(message, ...args);
    } else {
      // En production, log seulement les erreurs critiques
      console.error(message);
    }
  }

  static warn(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.warn(message, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.info(message, ...args);
    }
  }

  static debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.debug(message, ...args);
    }
  }

  /**
   * Log d'événements critiques toujours affichés
   */
  static critical(message: string, error?: Error) {
    console.error(`[CRITICAL] ${message}`, error);
  }

  /**
   * Log de sécurité toujours affiché
   */
  static security(event: string, details?: any) {
    console.warn(`[SECURITY] ${event}`, details);
  }
}