
/**
 * Utility functions for Google Sheets integration
 * Version sécurisée avec gestion d'état OAuth robuste
 */

import { googleAuthService } from '@/services/google/googleAuthService';

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
 * Check if the user is authenticated with Google Sheets
 * @returns Promise resolving to boolean indicating if authenticated
 */
export const checkGoogleAuth = async (): Promise<boolean> => {
  try {
    return await googleAuthService.isAuthenticated();
  } catch (error) {
    console.error("Error checking Google auth:", error);
    return false;
  }
};

/**
 * Initialize the Google OAuth flow using the secure service
 * @returns void (redirects to Google)
 */
export const initGoogleAuth = (): void => {
  try {
    googleAuthService.initiateAuth();
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    throw new Error("Impossible d'initier l'authentification Google");
  }
};

/**
 * Get a valid Google access token
 * @returns Promise resolving to access token or null
 */
export const getGoogleAccessToken = async (): Promise<string | null> => {
  try {
    return await googleAuthService.getValidAccessToken();
  } catch (error) {
    console.error("Error getting Google access token:", error);
    return null;
  }
};

/**
 * Sign out from Google Sheets
 * @returns Promise that resolves when sign out is complete
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await googleAuthService.signOut();
  } catch (error) {
    console.error("Error signing out from Google:", error);
    throw new Error("Erreur lors de la déconnexion de Google");
  }
};

/**
 * Get authenticated user information
 * @returns User info or null if not authenticated
 */
export const getGoogleUserInfo = (): { email: string; scopes: string[] } | null => {
  try {
    return googleAuthService.getAuthenticatedUser();
  } catch (error) {
    console.error("Error getting Google user info:", error);
    return null;
  }
};

// Fonctions de compatibilité avec l'ancien code
export const generateSecureState = (): string => {
  console.warn("generateSecureState is deprecated. Use GoogleAuthService directly.");
  const array = new Uint32Array(8);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
};
