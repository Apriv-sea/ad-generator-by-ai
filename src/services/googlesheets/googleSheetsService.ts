/**
 * Service Google Sheets unifié - Utilise le nouveau service core
 */

import { googleSheetsCoreService, GoogleSheetsData } from '@/services/core/googleSheetsCore';

export class GoogleSheetsService {
  // Méthodes d'authentification
  static isAuthenticated(): boolean {
    return googleSheetsCoreService.isAuthenticated();
  }

  static async initiateAuth(): Promise<string> {
    return googleSheetsCoreService.initiateAuth();
  }

  static async completeAuth(code: string): Promise<void> {
    return googleSheetsCoreService.completeAuth(code);
  }

  static logout(): void {
    googleSheetsCoreService.logout();
  }

  // Méthodes de manipulation des feuilles
  static extractSheetId(url: string): string | null {
    return googleSheetsCoreService.extractSheetId(url);
  }

  static async getSheetData(sheetId: string, range?: string): Promise<GoogleSheetsData> {
    return googleSheetsCoreService.getSheetData(sheetId, range);
  }

  static async saveSheetData(sheetId: string, data: string[][], range?: string): Promise<boolean> {
    return googleSheetsCoreService.saveSheetData(sheetId, data, range);
  }

  static createNewSheetUrl(): string {
    return googleSheetsCoreService.createNewSheetUrl();
  }

  // Méthode utilitaire pour les en-têtes standard
  static getStandardHeaders(): string[] {
    return [
      'Nom de la campagne',
      'Nom du groupe d\'annonces',
      'État du groupe d\'annonces',
      'Type de correspondance par défaut',
      'Top 3 mots-clés (séparés par des virgules)',
      'Titre 1', 'Titre 2', 'Titre 3',
      'Description 1', 'Description 2',
      'URL finale',
      'Chemin d\'affichage 1', 'Chemin d\'affichage 2',
      'Mots-clés ciblés', 'Mots-clés négatifs',
      'Audience ciblée', 'Extensions d\'annonces'
    ];
  }
}

// Maintenir la compatibilité avec l'export par défaut
export const googleSheetsService = GoogleSheetsService;

// Type alias pour la compatibilité
export type SheetData = GoogleSheetsData;