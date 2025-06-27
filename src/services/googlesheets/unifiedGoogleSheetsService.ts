
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GoogleSheetsData {
  values: string[][];
  title?: string;
}

export interface GoogleSheetsAuthResponse {
  authUrl?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

class UnifiedGoogleSheetsService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    this.accessToken = localStorage.getItem('google_sheets_access_token');
    this.refreshToken = localStorage.getItem('google_sheets_refresh_token');
  }

  private saveTokensToStorage(): void {
    if (this.accessToken) {
      localStorage.setItem('google_sheets_access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('google_sheets_refresh_token', this.refreshToken);
    }
  }

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

  async completeAuth(code: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'auth', code }
      });

      if (error) throw error;

      if (data.access_token) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.saveTokensToStorage();
        toast.success('Authentification Google réussie !');
      }
    } catch (error) {
      console.error('Erreur completion auth:', error);
      throw new Error('Impossible de compléter l\'authentification');
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async getSheetData(sheetId: string, range: string = 'A:Z'): Promise<GoogleSheetsData> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    console.log("📡 Récupération des données Google Sheets pour:", sheetId);

    try {
      // Essayer d'abord avec l'API authentifiée
      if (this.isAuthenticated()) {
        console.log("✅ Utilisation de l'API Google Sheets authentifiée");
        return await this.readSheetViaAPI(sheetId, range);
      }

      // Fallback vers CSV
      console.log("⚠️ Fallback vers export CSV");
      return await this.getSheetDataViaCSV(sheetId);

    } catch (error) {
      console.error("❌ Erreur lors de la récupération:", error);
      return {
        title: 'Erreur - Feuille vide',
        values: [this.getStandardHeaders()]
      };
    }
  }

  private async readSheetViaAPI(sheetId: string, range: string): Promise<GoogleSheetsData> {
    const { data, error } = await supabase.functions.invoke('google-sheets-api', {
      body: { action: 'read', sheetId, range },
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (error) throw error;

    return {
      values: data.values || [],
      title: data.properties?.title || 'Feuille Google Sheets'
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

    const rows = this.parseCSV(csvText);
    return {
      title: 'Feuille Google Sheets',
      values: rows
    };
  }

  async saveSheetData(sheetId: string, data: string[][], range: string = 'A1'): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentification Google requise');
    }

    try {
      const { error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'write', sheetId, data, range },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      throw error;
    }
  }

  async createSheet(title: string): Promise<{ id: string; url: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentification Google requise');
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-api', {
        body: { action: 'create', title },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (error) throw error;

      return {
        id: data.spreadsheetId,
        url: data.spreadsheetUrl
      };
    } catch (error) {
      console.error('Erreur création feuille:', error);
      throw error;
    }
  }

  extractSheetId(url: string): string | null {
    try {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Erreur extraction ID:", error);
      return null;
    }
  }

  private validateSheetId(sheetId: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(sheetId) && sheetId.length > 10;
  }

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
      'Titre 1', 'Titre 2', 'Titre 3',
      'Description 1', 'Description 2',
      'URL finale',
      'Chemin d\'affichage 1', 'Chemin d\'affichage 2',
      'Mots-clés ciblés', 'Mots-clés négatifs',
      'Audience ciblée', 'Extensions d\'annonces'
    ];
  }

  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('google_sheets_access_token');
    localStorage.removeItem('google_sheets_refresh_token');
    toast.info('Déconnecté de Google Sheets');
  }
}

export const unifiedGoogleSheetsService = new UnifiedGoogleSheetsService();
