
import { toast } from 'sonner';

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export class GoogleSheetsAuthService {
  private static readonly STORAGE_KEY = 'google_sheets_auth';
  private static readonly API_BASE_URL = 'https://lbmfkppvzimklebisefm.supabase.co/functions/v1/google-sheets-api';

  static isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens?.access_token);
  }

  static getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Erreur lecture tokens:', error);
      return null;
    }
  }

  static storeTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
      console.log('Tokens stockés avec succès');
    } catch (error) {
      console.error('Erreur stockage tokens:', error);
      toast.error('Impossible de sauvegarder l\'authentification');
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Tokens supprimés');
  }

  static async initiateAuth(): Promise<string> {
    try {
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth' })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (!data.authUrl) {
        throw new Error('URL d\'authentification manquante');
      }

      return data.authUrl;
    } catch (error) {
      console.error('Erreur initiation auth:', error);
      throw new Error('Impossible d\'initier l\'authentification Google');
    }
  }

  static async completeAuth(code: string): Promise<void> {
    try {
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', code })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const tokens = await response.json();
      if (!tokens.access_token) {
        throw new Error('Token d\'accès manquant');
      }

      this.storeTokens(tokens);
      console.log('Authentification complétée avec succès');
    } catch (error) {
      console.error('Erreur completion auth:', error);
      throw new Error('Impossible de compléter l\'authentification');
    }
  }

  static getAuthHeaders(): Record<string, string> {
    const tokens = this.getStoredTokens();
    if (!tokens?.access_token) {
      throw new Error('Pas de token d\'authentification');
    }

    return {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    };
  }
}
