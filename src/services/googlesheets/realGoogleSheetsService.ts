
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GoogleSheetsAuthResponse {
  authUrl?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

export interface GoogleSheetsData {
  values: string[][];
  title?: string;
}

class RealGoogleSheetsService {
  private accessToken: string | null = null;

  constructor() {
    // Récupérer le token depuis le localStorage au démarrage
    this.accessToken = localStorage.getItem('google_sheets_access_token');
  }

  /**
   * Initier le processus d'authentification Google
   */
  async initiateAuth(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'auth' }
      });

      if (error) throw error;
      
      return data.authUrl;
    } catch (error) {
      console.error('Erreur initiation auth:', error);
      throw new Error('Impossible d\'initier l\'authentification Google');
    }
  }

  /**
   * Compléter l'authentification avec le code d'autorisation
   */
  async completeAuth(code: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'auth', code }
      });

      if (error) throw error;

      if (data.access_token) {
        this.accessToken = data.access_token;
        localStorage.setItem('google_sheets_access_token', data.access_token);
        
        if (data.refresh_token) {
          localStorage.setItem('google_sheets_refresh_token', data.refresh_token);
        }
        
        toast.success('Authentification Google réussie !');
      }
    } catch (error) {
      console.error('Erreur completion auth:', error);
      throw new Error('Impossible de compléter l\'authentification');
    }
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Lire les données d'une feuille Google Sheets
   */
  async readSheet(sheetId: string, range: string = 'A:Z'): Promise<GoogleSheetsData> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentification Google requise');
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'read', sheetId, range }
      });

      if (error) throw error;

      return {
        values: data.values || [],
        title: data.properties?.title || 'Feuille Google Sheets'
      };
    } catch (error) {
      console.error('Erreur lecture feuille:', error);
      throw new Error('Impossible de lire la feuille Google Sheets');
    }
  }

  /**
   * Écrire des données dans une feuille Google Sheets
   */
  async writeSheet(sheetId: string, data: any[][], range: string = 'A1'): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentification Google requise');
    }

    try {
      const { error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'write', sheetId, data, range }
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erreur écriture feuille:', error);
      throw new Error('Impossible d\'écrire dans la feuille Google Sheets');
    }
  }

  /**
   * Créer une nouvelle feuille Google Sheets
   */
  async createSheet(title: string): Promise<{ id: string; url: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentification Google requise');
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'create', title }
      });

      if (error) throw error;

      return {
        id: data.spreadsheetId,
        url: data.spreadsheetUrl
      };
    } catch (error) {
      console.error('Erreur création feuille:', error);
      throw new Error('Impossible de créer la feuille Google Sheets');
    }
  }

  /**
   * Se déconnecter
   */
  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('google_sheets_access_token');
    localStorage.removeItem('google_sheets_refresh_token');
    toast.info('Déconnecté de Google Sheets');
  }
}

export const realGoogleSheetsService = new RealGoogleSheetsService();
