/**
 * Service wrapper pour Google Sheets avec interface synchrone/asynchrone
 * Délègue au service core pour la logique métier
 */

import { googleSheetsCoreService, GoogleSheetsData } from '@/services/core/googleSheetsCore';

export class GoogleSheetsService {
  // Méthodes d'authentification
  static async isAuthenticated(): Promise<boolean> {
    return await googleSheetsCoreService.isAuthenticated();
  }

  static async initiateAuth(): Promise<string> {
    return googleSheetsCoreService.initiateAuth();
  }

  static async completeAuth(code: string, state?: string): Promise<void> {
    return googleSheetsCoreService.completeAuth(code, state || '');
  }

  static async logout(): Promise<void> {
    return googleSheetsCoreService.logout();
  }

  // Méthodes de gestion des feuilles
  static extractSheetId(url: string): string | null {
    return googleSheetsCoreService.extractSheetId(url);
  }

  static async getSheetData(sheetId: string, range?: string): Promise<GoogleSheetsData> {
    return googleSheetsCoreService.getSheetData(sheetId, range);
  }

  static async saveSheetData(sheetId: string, data: string[][], range?: string): Promise<boolean> {
    return googleSheetsCoreService.saveSheetData(sheetId, data, range);
  }

  static async createNewSheet(): Promise<{ spreadsheetId: string; spreadsheetUrl: string } | null> {
    return googleSheetsCoreService.createNewSheet();
  }

  // Méthodes utilitaires
  static createNewSheetUrl(): string {
    return googleSheetsCoreService.createNewSheetUrl();
  }

  // Méthodes statiques pour compatibilité avec l'ancien code
  static async connectToGoogleSheets(sheetId: string): Promise<GoogleSheetsData> {
    return googleSheetsCoreService.getSheetData(sheetId);
  }

  static async writeToGoogleSheets(sheetId: string, data: string[][]): Promise<boolean> {
    return googleSheetsCoreService.saveSheetData(sheetId, data);
  }
}

// Export par défaut pour compatibilité
export default GoogleSheetsService;

// Export instance for compatibility with older imports
export const googleSheetsService = GoogleSheetsService;