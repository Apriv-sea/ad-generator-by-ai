
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
      console.log('🌐 URL actuelle:', window.location.href);
      console.log('🌐 Origin actuel:', window.location.origin);

      // Déterminer l'URI de redirection basé sur l'environnement actuel
      const currentOrigin = window.location.origin;
      const redirectUri = `${currentOrigin}/auth/callback/google`;
      
      console.log('🔗 URI de redirection calculée:', redirectUri);

      // Requête d'authentification avec l'URI de redirection dynamique
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': currentOrigin,
          'Referer': window.location.href
        },
        body: JSON.stringify({ 
          action: 'auth',
          redirectUri: redirectUri
        })
      });

      console.log('📡 Réponse de l\'Edge Function:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Erreur HTTP détaillée:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });

        let errorMessage = `Erreur serveur (${response.status})`;
        let errorDetails = '';
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || '';
          
          console.log('📋 Détails de l\'erreur parsée:', errorData);
        } catch (parseError) {
          console.log('❌ Impossible de parser la réponse d\'erreur comme JSON');
          
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
            errorMessage = 'L\'Edge Function retourne du HTML au lieu de JSON. Problème de configuration Supabase.';
          }
        }

        const fullError = errorDetails ? `${errorMessage}\n\nDétails: ${errorDetails}` : errorMessage;
        throw new Error(fullError);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('❌ Réponse non-JSON reçue:', contentType);
        throw new Error(`L'Edge Function ne retourne pas du JSON valide (Content-Type: ${contentType})`);
      }

      const data = await response.json();
      console.log('✅ Données reçues:', { 
        hasAuthUrl: !!data.authUrl,
        hasState: !!data.state 
      });

      if (!data.authUrl) {
        console.error('❌ URL d\'authentification manquante dans la réponse:', data);
        throw new Error('URL d\'authentification manquante dans la réponse');
      }

      // Stocker le state pour vérification ultérieure
      if (data.state) {
        sessionStorage.setItem('google_auth_state', data.state);
      }

      console.log('✅ URL d\'authentification générée avec succès');
      return data.authUrl;

    } catch (error) {
      console.error('❌ Erreur complète lors de l\'initiation:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'authentification';
      throw new Error(`Impossible d'initier l'authentification Google: ${errorMessage}`);
    }
  }

  static async completeAuth(code: string): Promise<void> {
    try {
      console.log('🔑 Completion de l\'authentification avec le code...');
      
      // Utiliser la même URI de redirection
      const currentOrigin = window.location.origin;
      const redirectUri = `${currentOrigin}/auth/callback/google`;
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': currentOrigin,
          'Referer': window.location.href
        },
        body: JSON.stringify({ 
          action: 'auth', 
          code,
          redirectUri: redirectUri
        })
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
      
      // Nettoyer le state stocké
      sessionStorage.removeItem('google_auth_state');
      
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
