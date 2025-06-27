
import { toast } from 'sonner';

export interface GoogleSheetsData {
  values: string[][];
  title?: string;
}

class RealGoogleSheetsService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('google_sheets_access_token');
    this.refreshToken = localStorage.getItem('google_sheets_refresh_token');
  }

  private saveTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    localStorage.setItem('google_sheets_access_token', accessToken);
    
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('google_sheets_refresh_token', refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('google_sheets_access_token');
    localStorage.removeItem('google_sheets_refresh_token');
  }

  async initiateAuth(): Promise<string> {
    console.log('🔐 Initiation de l\'authentification Google Sheets via Edge Function');
    
    try {
      const response = await fetch('/api/google-sheets-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'auth'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'initiation de l\'authentification');
      }

      console.log('✅ URL d\'authentification générée');
      return data.authUrl;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation de l\'authentification:', error);
      throw error;
    }
  }

  async completeAuth(code: string): Promise<void> {
    console.log('🔐 Completion de l\'authentification avec le code');
    
    try {
      const response = await fetch('/api/google-sheets-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'auth',
          code: code
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'authentification');
      }

      // Sauvegarder les tokens
      this.saveTokens(data.access_token, data.refresh_token);
      
      console.log('✅ Authentification complétée et tokens sauvegardés');
    } catch (error) {
      console.error('❌ Erreur lors de la completion de l\'authentification:', error);
      throw error;
    }
  }

  async readSheet(sheetId: string, range: string = 'A:Z'): Promise<GoogleSheetsData> {
    if (!this.isAuthenticated()) {
      throw new Error('Non authentifié - veuillez d\'abord vous connecter');
    }

    console.log(`📖 Lecture de la feuille ${sheetId} avec la plage ${range}`);
    
    try {
      const response = await fetch('/api/google-sheets-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          action: 'read',
          sheetId: sheetId,
          range: range
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Si le token a expiré, essayer de le rafraîchir
        if (response.status === 401 && this.refreshToken) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          await this.refreshAccessToken();
          return this.readSheet(sheetId, range); // Retry
        }
        
        throw new Error(data.error || 'Erreur lors de la lecture de la feuille');
      }

      console.log('📊 Données récupérées:', {
        rowCount: data.values?.length || 0,
        hasHeaders: data.values?.length > 0,
        hasData: data.values?.length > 1,
        firstRow: data.values?.[0],
        totalRows: data.values?.length || 0
      });

      // Vérifier si nous avons des données au-delà des en-têtes
      if (!data.values || data.values.length === 0) {
        console.warn('⚠️ Aucune donnée trouvée dans la feuille');
        return {
          values: [],
          title: 'Feuille vide'
        };
      }

      if (data.values.length === 1) {
        console.warn('⚠️ Seulement les en-têtes trouvés, aucune donnée');
        return {
          values: data.values,
          title: 'Feuille avec en-têtes seulement'
        };
      }

      // Filtrer les lignes vides
      const filteredValues = data.values.filter((row: string[]) => {
        return row && row.length > 0 && row.some(cell => cell && cell.trim() !== '');
      });

      console.log(`✅ ${filteredValues.length} lignes utiles trouvées (en-têtes inclus)`);

      return {
        values: filteredValues,
        title: data.title || 'Feuille Google Sheets'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la lecture:', error);
      throw error;
    }
  }

  async writeSheet(sheetId: string, data: string[][], range: string = 'A1'): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Non authentifié - veuillez d\'abord vous connecter');
    }

    console.log(`✍️ Écriture dans la feuille ${sheetId}`);
    
    try {
      const response = await fetch('/api/google-sheets-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          action: 'write',
          sheetId: sheetId,
          data: data,
          range: range
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Si le token a expiré, essayer de le rafraîchir
        if (response.status === 401 && this.refreshToken) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          await this.refreshAccessToken();
          return this.writeSheet(sheetId, data, range); // Retry
        }
        
        throw new Error(result.error || 'Erreur lors de l\'écriture');
      }

      console.log('✅ Données écrites avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'écriture:', error);
      throw error;
    }
  }

  async createSheet(title: string): Promise<{ id: string; url: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('Non authentifié - veuillez d\'abord vous connecter');
    }

    console.log(`📝 Création d'une nouvelle feuille: ${title}`);
    
    try {
      const response = await fetch('/api/google-sheets-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          action: 'create',
          title: title
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Si le token a expiré, essayer de le rafraîchir
        if (response.status === 401 && this.refreshToken) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          await this.refreshAccessToken();
          return this.createSheet(title); // Retry
        }
        
        throw new Error(result.error || 'Erreur lors de la création de la feuille');
      }

      console.log('✅ Feuille créée avec succès');
      return {
        id: result.spreadsheetId,
        url: result.spreadsheetUrl
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    console.log('🔄 Rafraîchissement du token d\'accès...');
    
    try {
      // Utiliser l'API Google OAuth2 directement pour rafraîchir le token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: 'YOUR_CLIENT_ID', // Remplacé par l'edge function
          client_secret: 'YOUR_CLIENT_SECRET', // Remplacé par l'edge function
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || 'Erreur lors du rafraîchissement du token');
      }

      this.saveTokens(data.access_token);
      console.log('✅ Token rafraîchi avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du token:', error);
      this.clearTokens();
      throw new Error('Impossible de rafraîchir le token. Veuillez vous reconnecter.');
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout(): void {
    console.log('🚪 Déconnexion Google Sheets');
    this.clearTokens();
  }
}

export const realGoogleSheetsService = new RealGoogleSheetsService();
