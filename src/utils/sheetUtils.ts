
/**
 * Utility functions for Google Sheets operations
 */

/**
 * Extract Google Sheets ID from URL
 */
export function extractSheetId(url: string): string | null {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'ID:", error);
    return null;
  }
}

/**
 * Validate Google Sheets ID format
 */
export function validateSheetId(sheetId: string): boolean {
  return /^[a-zA-Z0-9-_]{40,}$/.test(sheetId);
}
