
import { GoogleSheetsAuthService } from './googleSheetsAuthService';
import { GoogleSheetsErrorHandler } from './googleSheetsErrorHandler';

export interface SheetData {
  values: string[][];
  range?: string;
  majorDimension?: string;
  title?: string;
}

export class GoogleSheetsApiService {
  private static readonly API_BASE_URL = 'https://lbmfkppvzimklebisefm.supabase.co/functions/v1/google-sheets-api';

  static extractSheetId(url: string): string | null {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]{44})$/,
      /id=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  static validateSheetId(sheetId: string): boolean {
    return /^[a-zA-Z0-9-_]{10,}$/.test(sheetId);
  }

  static async getSheetData(sheetId: string, range: string = 'A:Z'): Promise<SheetData> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    if (!GoogleSheetsAuthService.isAuthenticated()) {
      throw new Error('Authentification Google Sheets requise');
    }

    try {
      console.log(`📖 Récupération des données: ${sheetId} (${range})`);
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          ...GoogleSheetsAuthService.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'read',
          sheetId,
          range
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur API (${response.status}):`, errorText);
        
        // Tenter de parser en JSON, sinon traiter comme erreur HTML
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw { status: response.status, message: 'Réponse HTML reçue au lieu de JSON' };
        }
        
        throw { status: response.status, ...errorData };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Réponse non-JSON reçue du serveur');
      }

      const data = await response.json();
      console.log('✅ Données récupérées:', {
        rowCount: data.values?.length || 0,
        hasData: !!(data.values && data.values.length > 0)
      });

      return {
        values: data.values || [],
        range: data.range,
        majorDimension: data.majorDimension,
        title: data.title || 'Feuille Google Sheets'
      };

    } catch (error) {
      const handledError = GoogleSheetsErrorHandler.handleApiError(error);
      console.error('❌ Erreur récupération données:', handledError);
      throw new Error(handledError.message);
    }
  }

  static async saveSheetData(sheetId: string, data: string[][], range: string = 'A1'): Promise<boolean> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    if (!GoogleSheetsAuthService.isAuthenticated()) {
      throw new Error('Authentification Google Sheets requise');
    }

    try {
      console.log(`✍️ Sauvegarde des données: ${sheetId} (${data.length} lignes)`);
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          ...GoogleSheetsAuthService.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'write',
          sheetId,
          data,
          range
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, ...errorData };
      }

      console.log('✅ Données sauvegardées avec succès');
      return true;

    } catch (error) {
      const handledError = GoogleSheetsErrorHandler.handleApiError(error);
      console.error('❌ Erreur sauvegarde:', handledError);
      throw new Error(handledError.message);
    }
  }

  static createNewSheetUrl(): string {
    return 'https://docs.google.com/spreadsheets/create';
  }
}
