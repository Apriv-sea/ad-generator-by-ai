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

  // Méthode utilitaire pour les en-têtes standard avec colonnes de comptage de caractères
  static getStandardHeaders(): string[] {
    const headers = [];
    
    // Colonnes de base
    headers.push('Nom de la campagne');
    headers.push('Nom du groupe d\'annonces');
    headers.push('État du groupe d\'annonces');
    headers.push('Type de correspondance par défaut');
    headers.push('Top 3 mots-clés (séparés par des virgules)');
    
    // Titres (sans colonnes de comptage)
    for (let i = 1; i <= 15; i++) {
      headers.push(`Titre ${i}`);
    }
    
    // Descriptions (sans colonnes de comptage)
    for (let i = 1; i <= 4; i++) {
      headers.push(`Description ${i}`);
    }
    
    // Colonnes finales
    headers.push('URL finale');
    headers.push('Chemin d\'affichage 1');
    headers.push('Chemin d\'affichage 2');
    headers.push('Mots-clés ciblés');
    headers.push('Mots-clés négatifs');
    headers.push('Audience ciblée');
    headers.push('Extensions d\'annonces');
    
    return headers;
  }
}

// Maintenir la compatibilité avec l'export par défaut
export const googleSheetsService = GoogleSheetsService;

// Type alias pour la compatibilité
export type SheetData = GoogleSheetsData;