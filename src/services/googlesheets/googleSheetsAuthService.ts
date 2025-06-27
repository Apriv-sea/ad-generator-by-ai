
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
      console.log('📡 URL de l\'API:', this.API_BASE_URL);

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'auth' })
      });

      console.log('📡 Réponse de l\'Edge Function:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP détaillée:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        // Tenter de parser en JSON si possible
        let errorMessage = `Erreur serveur (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si ce n'est pas du JSON, utiliser le message par défaut
          if (errorText.includes('<!DOCTYPE')) {
            errorMessage = 'L\'Edge Function retourne du HTML au lieu de JSON. Vérifiez la configuration Supabase.';
          }
        }

        throw new Error(errorMessage);
      }

      // Vérifier le Content-Type de la réponse
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('❌ Réponse non-JSON reçue:', contentType);
        throw new Error('L\'Edge Function ne retourne pas du JSON valide');
      }

      const data = await response.json();
      console.log('✅ Données reçues:', { hasAuthUrl: !!data.authUrl });

      if (!data.authUrl) {
        console.error('❌ URL d\'authentification manquante dans la réponse:', data);
        throw new Error('URL d\'authentification manquante dans la réponse');
      }

      console.log('✅ URL d\'authentification générée avec succès');
      return data.authUrl;

    } catch (error) {
      console.error('❌ Erreur complète lors de l\'initiation:', error);
      
      // Messages d'erreur plus spécifiques selon le type d'erreur
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
      
      if (error.message?.includes('HTML')) {
        throw new Error('Configuration Supabase incorrecte. L\'Edge Function ne répond pas correctement.');
      }

      // Utiliser le message d'erreur original ou un message générique
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'authentification';
      throw new Error(`Impossible d'initier l'authentification Google: ${errorMessage}`);
    }
  }

  static async completeAuth(code: string): Promise<void> {
    try {
      console.log('🔑 Completion de l\'authentification avec le code...');
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'auth', code })
      });

      console.log('📡 Réponse completion auth:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur completion auth:', errorText);
        
        let errorMessage = `Erreur serveur (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Message générique si pas de JSON
        }
        
        throw new Error(errorMessage);
      }

      const tokens = await response.json();
      console.log('✅ Tokens reçus:', { hasAccessToken: !!tokens.access_token });

      if (!tokens.access_token) {
        console.error('❌ Token d\'accès manquant:', tokens);
        throw new Error('Token d\'accès manquant dans la réponse');
      }

      this.storeTokens(tokens);
      console.log('✅ Authentification complétée avec succès');

    } catch (error) {
      console.error('❌ Erreur completion auth:', error);
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
