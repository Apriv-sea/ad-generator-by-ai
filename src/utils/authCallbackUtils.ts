
/**
 * Utility functions for authentication callback handling
 */

/**
 * Extracts errors from URL query parameters
 */
export const extractUrlErrors = (): { 
  hasError: boolean; 
  errorMessage?: string; 
} => {
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  if (error) {
    let errorMessage = `Erreur: ${error}`;
    if (errorDescription) {
      errorMessage += `\nDescription: ${errorDescription}`;
    }
    
    // Handle specific error for redirect URI mismatch
    if (error === 'redirect_uri_mismatch') {
      errorMessage += `\n\nL'URI de redirection utilisée ne correspond pas à celles configurées dans votre console Google Cloud.\n`;
      errorMessage += `URI attendue pour l'environnement actuel: ${window.location.origin}/auth/callback/google\n`;
      errorMessage += `Assurez-vous d'ajouter cette URI exacte dans votre console Google Cloud.`;
    }
    
    return { 
      hasError: true, 
      errorMessage 
    };
  }
  return { hasError: false };
};
