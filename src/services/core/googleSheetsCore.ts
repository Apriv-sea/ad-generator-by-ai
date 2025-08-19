/**
 * Service Google Sheets unifié et sécurisé
 * Utilise uniquement des tokens server-side pour la sécurité
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
  // =============== AUTHENTIFICATION ===============

  // Check if authenticated via server-side token validation
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'check_auth' }
      });
      return response.data?.authenticated === true;
    } catch {
      return false;
    }
  }

  // Initiate Google Sheets authentication flow via secure edge function
  async initiateAuth(): Promise<string> {
    try {
      const response = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'initiate_auth' }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to initiate authentication');
      }
      
      return response.data.authUrl;
    } catch (error) {
      console.error('Authentication initiation failed:', error);
      throw error;
    }
  }

  // Complete authentication with authorization code via secure edge function
  async completeAuth(code: string, state: string): Promise<void> {
    try {
      const response = await supabase.functions.invoke('google-sheets-api', {
        body: { 
          action: 'exchange_token',
          code,
          state
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to complete authentication');
      }
      
      console.log('Authentication completed successfully');
    } catch (error) {
      console.error('Authentication completion failed:', error);
      throw error;
    }
  }

  // Logout and clear server-side tokens
  async logout(): Promise<void> {
    try {
      await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'logout' }
      });
      toast.info('Déconnecté de Google Sheets');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Erreur lors de la déconnexion');
    }
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

  // Get data from Google Sheets via secure edge function
  async getSheetData(sheetId: string, range?: string): Promise<GoogleSheetsData> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    try {
      const isAuth = await this.isAuthenticated();
      
      if (isAuth) {
        return await this.readSheetViaAPI(sheetId, range);
      } else {
        // Fall back to CSV export (limited functionality)
        return await this.getSheetDataViaCSV(sheetId);
      }
    } catch (error) {
      console.error("Erreur récupération données:", error);
      return {
        title: 'Erreur - Feuille vide',
        values: [this.getStandardHeaders()]
      };
    }
  }

  private async readSheetViaAPI(sheetId: string, range?: string): Promise<GoogleSheetsData> {
    try {
      const response = await supabase.functions.invoke('google-sheets-api', {
        body: { 
          action: 'read_sheet',
          sheetId,
          range: range || 'A:Z'
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to read sheet data');
      }
      
      return {
        values: response.data.values || [],
        title: `Sheet ${sheetId}`,
        info: `Read ${response.data.values?.length || 0} rows`
      };
    } catch (error) {
      console.error('Failed to get sheet data:', error);
      throw error;
    }
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

  // Save data to Google Sheets via secure edge function
  async saveSheetData(sheetId: string, data: string[][], range?: string): Promise<boolean> {
    try {
      const response = await supabase.functions.invoke('google-sheets-api', {
        body: { 
          action: 'write_sheet',
          sheetId,
          data,
          range: range || 'A1'
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to save sheet data');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save sheet data:', error);
      return false;
    }
  }

  async createNewSheet(): Promise<{ spreadsheetId: string; spreadsheetUrl: string } | null> {
    try {
      const response = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'create_sheet' }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create sheet');
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to create sheet:', error);
      return null;
    }
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
}

export const googleSheetsCoreService = new GoogleSheetsCoreService();