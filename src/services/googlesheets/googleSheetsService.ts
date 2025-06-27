
import { GoogleSheetsAuthService } from './googleSheetsAuthService';
import { GoogleSheetsApiService, SheetData } from './googleSheetsApiService';

export class GoogleSheetsService {
  // Méthodes d'authentification
  static isAuthenticated(): boolean {
    return GoogleSheetsAuthService.isAuthenticated();
  }

  static async initiateAuth(): Promise<string> {
    return GoogleSheetsAuthService.initiateAuth();
  }

  static async completeAuth(code: string): Promise<void> {
    return GoogleSheetsAuthService.completeAuth(code);
  }

  static logout(): void {
    GoogleSheetsAuthService.clearTokens();
  }

  // Méthodes de manipulation des feuilles
  static extractSheetId(url: string): string | null {
    return GoogleSheetsApiService.extractSheetId(url);
  }

  static async getSheetData(sheetId: string, range?: string): Promise<SheetData> {
    return GoogleSheetsApiService.getSheetData(sheetId, range);
  }

  static async saveSheetData(sheetId: string, data: string[][], range?: string): Promise<boolean> {
    return GoogleSheetsApiService.saveSheetData(sheetId, data, range);
  }

  static createNewSheetUrl(): string {
    return GoogleSheetsApiService.createNewSheetUrl();
  }

  // Méthode utilitaire pour les en-têtes standard
  static getStandardHeaders(): string[] {
    return [
      'Campagne',
      'Groupe d\'annonces', 
      'Mots-clés',
      'État',
      'CPC max',
      'Titre 1',
      'Titre 2', 
      'Titre 3',
      'Description 1',
      'Description 2',
      'URL finale',
      'Chemin d\'affichage 1',
      'Chemin d\'affichage 2'
    ];
  }
}

// Maintenir la compatibilité avec l'export par défaut
export const googleSheetsService = GoogleSheetsService;
