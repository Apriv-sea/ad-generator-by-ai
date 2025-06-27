
export interface GoogleSheetsError {
  code: string;
  message: string;
  details?: any;
}

export class GoogleSheetsErrorHandler {
  static handleApiError(error: any): GoogleSheetsError {
    console.error('Erreur API Google Sheets:', error);

    // Erreur de réseau
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Erreur de connexion. Vérifiez votre connexion internet.'
      };
    }

    // Erreur HTTP
    if (error.status) {
      switch (error.status) {
        case 400:
          return {
            code: 'BAD_REQUEST',
            message: 'Requête invalide. Vérifiez l\'URL de votre feuille Google Sheets.'
          };
        case 401:
          return {
            code: 'UNAUTHORIZED',
            message: 'Authentification expirée. Reconnectez-vous à Google Sheets.'
          };
        case 403:
          return {
            code: 'FORBIDDEN',
            message: 'Accès refusé. Assurez-vous que la feuille est partagée publiquement ou que vous avez les permissions.'
          };
        case 404:
          return {
            code: 'NOT_FOUND',
            message: 'Feuille introuvable. Vérifiez l\'URL de votre feuille Google Sheets.'
          };
        case 429:
          return {
            code: 'RATE_LIMITED',
            message: 'Trop de requêtes. Attendez quelques instants avant de réessayer.'
          };
        default:
          return {
            code: 'HTTP_ERROR',
            message: `Erreur serveur (${error.status}). Réessayez plus tard.`
          };
      }
    }

    // Erreur de parsing JSON
    if (error.message?.includes('JSON') || error.message?.includes('token')) {
      return {
        code: 'INVALID_RESPONSE',
        message: 'Réponse invalide du serveur. La feuille n\'est peut-être pas accessible publiquement.'
      };
    }

    // Erreur générique
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Erreur inconnue lors de l\'accès à Google Sheets.'
    };
  }

  static isAuthenticationError(error: GoogleSheetsError): boolean {
    return ['UNAUTHORIZED', 'FORBIDDEN'].includes(error.code);
  }

  static isRetryableError(error: GoogleSheetsError): boolean {
    return ['NETWORK_ERROR', 'RATE_LIMITED', 'HTTP_ERROR'].includes(error.code);
  }
}
