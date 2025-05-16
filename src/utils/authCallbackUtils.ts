
/**
 * Utility functions for authentication callback handling
 */

/**
 * Processes Google Sheets authentication callback and stores tokens
 */
export const processGoogleSheetsCallback = (): {
  success: boolean;
  accessToken?: string;
  errorDetails?: string;
} => {
  try {
    // Extract URL parameters from hash for OAuth2 implicit grant
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);
    
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const state = params.get('state');
    
    // Verify that state matches the one stored
    const savedState = localStorage.getItem('google_auth_state');
    
    if (!accessToken) {
      return {
        success: false,
        errorDetails: "Token d'accès manquant. Veuillez réessayer l'authentification."
      };
    }
    
    if (!state || !savedState) {
      return {
        success: false,
        errorDetails: "État de sécurité manquant. Veuillez vider le cache du navigateur et réessayer."
      };
    }
    
    if (state !== savedState) {
      return {
        success: false,
        errorDetails: `État de sécurité non valide. Reçu: ${state}, Attendu: ${savedState}.`
      };
    }
    
    // Store the access token
    localStorage.setItem('google_access_token', accessToken);
    localStorage.removeItem('google_auth_state'); // Clean up the state
    
    // Calculate the expiration date
    if (expiresIn) {
      const expiryTime = new Date().getTime() + parseInt(expiresIn) * 1000;
      localStorage.setItem('google_token_expiry', expiryTime.toString());
    }
    
    return {
      success: true,
      accessToken
    };
  } catch (error: any) {
    return {
      success: false,
      errorDetails: error.message || "Une erreur s'est produite lors de l'authentification."
    };
  }
};

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
