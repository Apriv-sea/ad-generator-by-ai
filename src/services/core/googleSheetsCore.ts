/**
 * Service Google Sheets unifié et optimisé
 * Centralise toute la logique Google Sheets en un seul service cohérent
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GoogleSheetsData {
  values: string[][];
  title?: string;
  info?: any;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
}

class GoogleSheetsCoreService {
  private static readonly STORAGE_KEY = 'google_sheets_auth';
  private static readonly API_BASE_URL = 'https://lbmfkppvzimklebisefm.supabase.co/functions/v1/google-sheets-api';
  
  // Détection si on est dans l'environnement de preview Lovable (pas l'app déployée)
  private isLovablePreview(): boolean {
    return window.location.hostname.includes('localhost') || 
           window.location.hostname.includes('127.0.0.1') ||
           window.location.hostname.includes('lovable.dev') ||
           window.location.hostname.includes('preview.lovable');
  }

  // =============== AUTHENTIFICATION ===============

  private getRedirectUri(): string {
    const origin = window.location.origin;
    const redirectPath = '/auth/google';
    return `${origin}${redirectPath}`;
  }

  isAuthenticated(): boolean {
    // En mode preview, on simule l'authentification
    if (this.isLovablePreview()) {
      return false; // Désactiver les fonctionnalités Google Sheets en preview
    }
    
    const tokens = this.getStoredTokens();
    if (!tokens?.access_token) return false;
    
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      this.clearTokens();
      return false;
    }
    
    return true;
  }

  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem(GoogleSheetsCoreService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private storeTokens(tokens: AuthTokens): void {
    try {
      if (tokens.expires_in && !tokens.expires_at) {
        tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
      }
      localStorage.setItem(GoogleSheetsCoreService.STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Erreur stockage tokens:', error);
      toast.error('Impossible de sauvegarder l\'authentification');
    }
  }

  clearTokens(): void {
    localStorage.removeItem(GoogleSheetsCoreService.STORAGE_KEY);
  }

  async initiateAuth(): Promise<string> {
    console.log('🚀 Début initiateAuth - hostname:', window.location.hostname);
    console.log('🔧 isLovablePreview:', this.isLovablePreview());
    
    // En mode preview Lovable, on retourne une URL de démonstration
    if (this.isLovablePreview()) {
      throw new Error('Les fonctionnalités Google Sheets ne sont pas disponibles en mode preview. Déployez votre application pour les utiliser.');
    }
    
    try {
      const redirectUri = this.getRedirectUri();
      console.log('🔗 RedirectUri:', redirectUri);
      console.log('🌐 API URL:', GoogleSheetsCoreService.API_BASE_URL);
      
      const requestBody = { 
        action: 'auth',
        redirectUri: redirectUri
      };
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(GoogleSheetsCoreService.API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      
      if (!data.authUrl) {
        throw new Error('URL d\'authentification manquante');
      }

      return data.authUrl;
    } catch (error) {
      console.error('❌ Erreur initiateAuth complète:', error);
      console.error('❌ Erreur stack:', error.stack);
      console.error('❌ Erreur type:', typeof error);
      console.error('❌ Erreur message:', error.message);
      
      // Re-lancer l'erreur originale pour plus de détails
      if (error.message.includes('fetch')) {
        throw new Error(`Erreur réseau: ${error.message}. Vérifiez votre connexion internet.`);
      }
      
      throw error; // Re-lancer l'erreur originale au lieu du message générique
    }
  }

  async completeAuth(code: string): Promise<void> {
    const response = await fetch(GoogleSheetsCoreService.API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'auth', 
        code,
        redirectUri: this.getRedirectUri()
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur completion (${response.status})`);
    }

    const tokens = await response.json();
    if (!tokens.access_token) {
      throw new Error('Token d\'accès manquant');
    }

    this.storeTokens(tokens);
  }

  // =============== OPERATIONS SHEETS ===============

  extractSheetId(url: string): string | null {
    try {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private validateSheetId(sheetId: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(sheetId) && sheetId.length > 10;
  }

  async getSheetData(sheetId: string, range: string = 'A:AZ'): Promise<GoogleSheetsData> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    try {
      // En mode preview, on retourne des données de démonstration
      if (this.isLovablePreview()) {
        return {
          title: 'Feuille de démonstration (Preview)',
          values: [this.getStandardHeaders()]
        };
      }
      
      if (this.isAuthenticated()) {
        return await this.readSheetViaAPI(sheetId, range);
      }
      return await this.getSheetDataViaCSV(sheetId);
    } catch (error) {
      console.error("Erreur récupération données:", error);
      return {
        title: 'Erreur - Feuille vide',
        values: [this.getStandardHeaders()]
      };
    }
  }

  private async readSheetViaAPI(sheetId: string, range: string): Promise<GoogleSheetsData> {
    const tokens = this.getStoredTokens();
    const response = await fetch(GoogleSheetsCoreService.API_BASE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens?.access_token}`
      },
      body: JSON.stringify({ action: 'read', sheetId, range })
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return {
      values: data.values || [],
      title: data.properties?.title || 'Feuille Google Sheets',
      info: data.properties
    };
  }

  private async getSheetDataViaCSV(sheetId: string): Promise<GoogleSheetsData> {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(exportUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error("Aucune donnée trouvée dans la feuille");
    }

    return {
      title: 'Feuille Google Sheets',
      values: this.parseCSV(csvText)
    };
  }

  async saveSheetData(sheetId: string, data: string[][], range: string = 'A1'): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentification Google requise');
    }

    const tokens = this.getStoredTokens();
    const response = await fetch(GoogleSheetsCoreService.API_BASE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens?.access_token}`
      },
      body: JSON.stringify({ action: 'write', sheetId, data, range })
    });

    if (!response.ok) {
      throw new Error(`Erreur sauvegarde: ${response.status}`);
    }

    return true;
  }

  // =============== UTILITAIRES ===============

  private parseCSV(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        rows.push(cells);
      }
    }
    
    return rows;
  }

  private getStandardHeaders(): string[] {
    return [
      'Nom de la campagne',
      'Nom du groupe d\'annonces',
      'État du groupe d\'annonces',
      'Type de correspondance par défaut',
      'Top 3 mots-clés (séparés par des virgules)',
      'Titre 1', 'Titre 2', 'Titre 3', 'Titre 4', 'Titre 5',
      'Titre 6', 'Titre 7', 'Titre 8', 'Titre 9', 'Titre 10',
      'Titre 11', 'Titre 12', 'Titre 13', 'Titre 14', 'Titre 15',
      'Description 1', 'Description 2', 'Description 3', 'Description 4',
      'URL finale',
      'Chemin d\'affichage 1', 'Chemin d\'affichage 2',
      'Mots-clés ciblés', 'Mots-clés négatifs',
      'Audience ciblée', 'Extensions d\'annonces'
    ];
  }

  createNewSheetUrl(): string {
    return 'https://docs.google.com/spreadsheets/create';
  }

  logout(): void {
    this.clearTokens();
    toast.info('Déconnecté de Google Sheets');
  }
}

export const googleSheetsCoreService = new GoogleSheetsCoreService();