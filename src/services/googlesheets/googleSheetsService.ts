
import { toast } from 'sonner';

export interface GoogleSheetsData {
  values: string[][];
  title?: string;
}

class GoogleSheetsService {
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

  // Nouvelle méthode pour extraire l'ID de la feuille depuis l'URL
  extractSheetId(url: string): string | null {
    console.log('🔍 Extraction de l\'ID depuis l\'URL:', url);
    
    // Pattern pour les URLs Google Sheets
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit#gid=/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log('✅ ID extrait:', match[1]);
        return match[1];
      }
    }

    console.warn('❌ Impossible d\'extraire l\'ID de la feuille depuis l\'URL');
    return null;
  }

  // Nouvelle méthode pour créer une URL de nouvelle feuille
  createNewSheetUrl(): string {
    return 'https://docs.google.com/spreadsheets/create';
  }

  // Nouvelle méthode pour obtenir les en-têtes standards
  getStandardHeaders(): string[] {
    return [
      'Nom de la campagne',
      'Nom du groupe d\'annonces',
      'État du groupe d\'annonces',
      'Type de correspondance par défaut',
      'Top 3 mots-clés (séparés par des virgules)',
      'Titre 1',
      'Titre 2', 
      'Titre 3',
      'Description 1',
      'Description 2',
      'URL finale',
      'Chemin d\'affichage 1',
      'Chemin d\'affichage 2',
      'Mots-clés ciblés',
      'Mots-clés négatifs',
      'Audience ciblée',
      'Extensions d\'annonces'
    ];
  }

  // Nouvelle méthode pour sauvegarder les données dans une feuille
  async saveSheetData(sheetId: string, data: string[][]): Promise<boolean> {
    return await this.writeSheet(sheetId, data);
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

      this.saveTokens(data.access_token, data.refresh_token);
      
      console.log('✅ Authentification complétée et tokens sauvegardés');
    } catch (error) {
      console.error('❌ Erreur lors de la completion de l\'authentification:', error);
      throw error;
    }
  }

  async getSheetData(sheetId: string, range: string = 'A:Z'): Promise<GoogleSheetsData> {
    if (!this.isAuthenticated()) {
      throw new Error('Non authentifié - veuillez d\'abord vous connecter');
    }

    console.log(`📖 DIAGNOSTIC COMPLET - Lecture de la feuille ${sheetId} avec la plage ${range}`);
    console.log(`🔑 Token présent: ${this.accessToken ? 'OUI' : 'NON'}`);
    
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

      console.log(`📡 Réponse API Status: ${response.status} ${response.statusText}`);
      console.log(`📡 Headers de réponse:`, Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      
      console.log(`📊 DIAGNOSTIC SERVICE - Réponse brute complète:`, {
        status: response.status,
        ok: response.ok,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        hasValues: !!data?.values,
        valuesType: Array.isArray(data?.values) ? 'array' : typeof data?.values,
        valuesLength: data?.values?.length || 0,
        rawDataSample: data?.values?.slice(0, 3),
        title: data?.title,
        range: data?.range,
        majorDimension: data?.majorDimension,
        completeResponse: data
      });
      
      if (!response.ok) {
        console.error('❌ Erreur API détaillée:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          message: data.message,
          details: data
        });
        
        if (response.status === 401 && this.refreshToken) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          await this.refreshAccessToken();
          return this.getSheetData(sheetId, range);
        }
        
        throw new Error(data.error || `Erreur API ${response.status}: ${response.statusText}`);
      }

      // Diagnostic approfondi des données reçues
      if (!data.values) {
        console.log('⚠️ DIAGNOSTIC SERVICE - Pas de propriété "values" dans la réponse');
        console.log('Structure de la réponse:', JSON.stringify(data, null, 2));
        return {
          values: [],
          title: 'Aucune donnée - pas de propriété values'
        };
      }

      if (!Array.isArray(data.values)) {
        console.log('⚠️ DIAGNOSTIC SERVICE - "values" n\'est pas un tableau');
        console.log('Type de values:', typeof data.values);
        console.log('Contenu de values:', data.values);
        return {
          values: [],
          title: 'Erreur - values n\'est pas un tableau'
        };
      }

      if (data.values.length === 0) {
        console.log('⚠️ DIAGNOSTIC SERVICE - Tableau values vide');
        return {
          values: [],
          title: 'Feuille vide - aucune donnée'
        };
      }

      // Diagnostic ligne par ligne
      console.log(`📋 DIAGNOSTIC SERVICE LIGNE PAR LIGNE (${data.values.length} lignes totales):`);
      data.values.forEach((row, index) => {
        console.log(`  Service Ligne ${index}: [${Array.isArray(row) ? row.length : 'N/A'} cellules] = ${JSON.stringify(row)}`);
        
        if (Array.isArray(row)) {
          const nonEmptyCells = row.filter(cell => {
            if (cell === null || cell === undefined) return false;
            const cellStr = String(cell).trim();
            return cellStr !== '';
          });
          console.log(`    Service -> ${nonEmptyCells.length} cellules non vides: ${JSON.stringify(nonEmptyCells)}`);
        }
      });

      if (data.values.length === 1) {
        console.log('⚠️ DIAGNOSTIC SERVICE - Une seule ligne trouvée (probablement les en-têtes)');
        console.log('En-têtes:', data.values[0]);
        toast.warning('Seuls les en-têtes ont été détectés. Vérifiez que votre feuille contient des données.');
        return {
          values: data.values,
          title: 'En-têtes seulement'
        };
      }

      console.log(`✅ DIAGNOSTIC SERVICE - ${data.values.length} lignes détectées (${data.values.length - 1} lignes de données + en-têtes)`);
      console.log('Service Première ligne (en-têtes):', data.values[0]);
      console.log('Service Deuxième ligne (premier enregistrement):', data.values[1]);
      console.log('Service Dernière ligne:', data.values[data.values.length - 1]);

      return {
        values: data.values,
        title: data.title || `Feuille Google Sheets - ${data.values.length - 1} lignes de données`
      };
    } catch (error) {
      console.error('❌ DIAGNOSTIC SERVICE - Erreur lors de la lecture:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
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
        if (response.status === 401 && this.refreshToken) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          await this.refreshAccessToken();
          return this.writeSheet(sheetId, data, range);
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
        if (response.status === 401 && this.refreshToken) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          await this.refreshAccessToken();
          return this.createSheet(title);
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

export const googleSheetsService = new GoogleSheetsService();
