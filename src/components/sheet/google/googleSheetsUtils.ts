
/**
 * Utility functions for Google Sheets integration
 */

/**
 * Extract the Sheet ID from a Google Sheets URL
 * @param url The Google Sheets URL
 * @returns The Sheet ID or null if not found
 */
export const extractSheetId = (url: string): string | null => {
  try {
    // Format typique: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'ID de la feuille:", error);
    return null;
  }
};

/**
 * Generate an embed URL for a Google Sheet
 * @param sheetId The Sheet ID
 * @returns The embed URL
 */
export const generateEmbedUrl = (sheetId: string): string => {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&embedded=true`;
};

/**
 * Generate a secure random state string for OAuth
 * @returns A secure random state string
 */
export const generateSecureState = (): string => {
  const array = new Uint32Array(8);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
};

/**
 * Check if the user is authenticated with Google Sheets
 * @returns Promise resolving to boolean indicating if authenticated
 */
export const checkGoogleAuth = async (): Promise<boolean> => {
  const token = localStorage.getItem('google_access_token');
  if (!token) return false;
  
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
    return response.ok;
  } catch (error) {
    console.error("Error checking Google auth:", error);
    return false;
  }
};

/**
 * Initialize the Google OAuth flow
 * @returns The auth URL to redirect to
 */
export const initGoogleAuth = (): string => {
  // Configuration pour l'authentification OAuth2
  const clientId = "135447600769-22vd8jk726t5f8gp58robppv0v8eeme7.apps.googleusercontent.com";
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback/google');
  const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets');
  
  // Generate and store secure state
  const state = generateSecureState();
  localStorage.setItem('google_auth_state', state);
  
  console.log("URL de redirection:", window.location.origin + '/auth/callback/google');
  console.log("État de sécurité généré:", state);
  
  // Rediriger vers l'URL d'authentification Google avec prompt=consent pour forcer le dialogue de consentement
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&state=${state}&prompt=consent`;
};
