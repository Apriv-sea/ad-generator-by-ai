
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
      console.log('🔑 Initiation de l\'authentification Google Sheets...');
      
      // URI de redirection fixe basée sur l'origine actuelle
      const redirectUri = `${window.location.origin}/auth/callback/google`;
      
      console.log('🔗 URI de redirection:', redirectUri);
      console.log('📡 Appel de l\'API Supabase...');

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'auth',
          redirectUri: redirectUri
        })
      });

      console.log('📡 Réponse API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API détaillée:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        // Essayer de parser en JSON pour avoir plus d'infos
        let errorMessage = `Erreur serveur (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          console.log('📋 Détails erreur:', errorData);
        } catch {
          console.log('❌ Réponse non-JSON:', errorText.substring(0, 200));
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`Réponse non-JSON reçue (Content-Type: ${contentType})`);
      }

      const data = await response.json();
      console.log('✅ Données reçues:', { hasAuthUrl: !!data.authUrl });

      if (!data.authUrl) {
        throw new Error('URL d\'authentification manquante dans la réponse');
      }

      return data.authUrl;

    } catch (error) {
      console.error('❌ Erreur complète:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Impossible d'initier l'authentification: ${errorMessage}`);
    }
  }

  static async completeAuth(code: string): Promise<void> {
    try {
      console.log('🔑 Completion de l\'authentification...');
      
      const redirectUri = `${window.location.origin}/auth/callback/google`;
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'auth', 
          code,
          redirectUri: redirectUri
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur completion:', errorText);
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const tokens = await response.json();
      console.log('✅ Tokens reçus:', { hasAccessToken: !!tokens.access_token });

      if (!tokens.access_token) {
        throw new Error('Token d\'accès manquant');
      }

      this.storeTokens(tokens);
      console.log('✅ Authentification complétée');

    } catch (error) {
      console.error('❌ Erreur completion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Impossible de compléter l'authentification: ${errorMessage}`);
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
