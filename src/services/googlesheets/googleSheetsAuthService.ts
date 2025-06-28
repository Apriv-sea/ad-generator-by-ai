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
    console.log('🔐 Vérification authentification:', {
      hasAccessToken: !!tokens?.access_token,
      hasRefreshToken: !!tokens?.refresh_token,
      tokenExpiry: tokens?.expires_at,
      currentTime: Date.now(),
      isExpired: tokens?.expires_at ? Date.now() > tokens.expires_at : true
    });

    if (!tokens?.access_token) {
      console.log('❌ Pas de token d\'accès');
      return false;
    }

    // Vérifier si le token est expiré
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      console.log('⏰ Token expiré, nettoyage automatique');
      this.clearTokens();
      return false;
    }

    return true;
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
      console.log('🔑 === DEBUT AUTHENTIFICATION GOOGLE SHEETS ===');
      console.log('🌐 Environnement détecté:', {
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        isLocalhost: window.location.hostname === 'localhost',
        isLovable: window.location.hostname.includes('lovable.app')
      });
      
      // URI de redirection dynamique
      const redirectUri = `${window.location.origin}/auth/callback/google`;
      console.log('🔗 URI de redirection calculée:', redirectUri);
      
      // Construire la payload de la requête
      const requestPayload = { 
        action: 'auth',
        redirectUri: redirectUri
      };
      
      console.log('📦 Payload de la requête:', requestPayload);
      console.log('🌐 URL de l\'API:', this.API_BASE_URL);

      // Effectuer la requête avec plus de debugging
      console.log('📡 === DEBUT APPEL API ===');
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Referer': window.location.href
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📡 === REPONSE API RECUE ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      console.log('OK:', response.ok);

      // Lire le contenu de la réponse
      const responseText = await response.text();
      console.log('📄 Contenu brut de la réponse:', responseText);

      if (!response.ok) {
        console.error('❌ === ERREUR API DETAILLEE ===');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.error('Contenu:', responseText);

        // Analyser les erreurs courantes
        if (response.status === 401) {
          console.error('🔐 Erreur 401 - Problèmes possibles:');
          console.error('- Secrets Supabase manquants (GOOGLE_SHEETS_CLIENT_ID, GOOGLE_SHEETS_CLIENT_SECRET)');
          console.error('- Configuration OAuth Google incorrecte');
          console.error('- URLs de redirection non autorisées dans Google Cloud Console');
        }
        
        if (response.status === 403) {
          console.error('🚫 Erreur 403 - Accès refusé');
        }
        
        if (response.status === 500) {
          console.error('🔥 Erreur 500 - Problème serveur Edge Function');
        }

        // Essayer de parser la réponse d'erreur
        let errorMessage = `Erreur serveur (${response.status}): ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('📋 Détails de l\'erreur parsée:', errorData);
        } catch (parseError) {
          console.error('❌ Impossible de parser la réponse d\'erreur:', parseError);
        }

        throw new Error(errorMessage);
      }

      // Parser la réponse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Réponse JSON parsée:', data);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        throw new Error('Réponse serveur invalide (non-JSON)');
      }

      if (!data.authUrl) {
        console.error('❌ URL d\'authentification manquante dans la réponse:', data);
        throw new Error('URL d\'authentification manquante dans la réponse');
      }

      console.log('✅ === SUCCES GENERATION URL AUTH ===');
      console.log('URL générée:', data.authUrl);
      
      return data.authUrl;

    } catch (error) {
      console.error('❌ === ERREUR COMPLETE AUTHENTIFICATION ===');
      console.error('Type:', error.constructor.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Impossible d'initier l'authentification: ${errorMessage}`);
    }
  }

  static async completeAuth(code: string): Promise<void> {
    try {
      console.log('🔑 === COMPLETION AUTHENTIFICATION ===');
      console.log('Code reçu:', code.substring(0, 20) + '...');
      
      const redirectUri = `${window.location.origin}/auth/callback/google`;
      console.log('🔗 URI de redirection pour completion:', redirectUri);
      
      const requestPayload = { 
        action: 'auth', 
        code,
        redirectUri: redirectUri
      };
      
      console.log('📦 Payload completion:', { ...requestPayload, code: code.substring(0, 20) + '...' });

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Referer': window.location.href
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📡 Réponse completion:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const responseText = await response.text();
      console.log('📄 Contenu réponse completion:', responseText);

      if (!response.ok) {
        console.error('❌ Erreur completion:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        throw new Error(`Erreur serveur completion (${response.status})`);
      }

      const tokens = JSON.parse(responseText);
      console.log('✅ Tokens reçus:', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token });

      if (!tokens.access_token) {
        throw new Error('Token d\'accès manquant');
      }

      this.storeTokens(tokens);
      console.log('✅ === COMPLETION REUSSIE ===');

    } catch (error) {
      console.error('❌ Erreur completion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Impossible de compléter l'authentification: ${errorMessage}`);
    }
  }

  static getAuthHeaders(): Record<string, string> {
    const tokens = this.getStoredTokens();
    console.log('🔐 Récupération headers auth:', {
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.access_token,
      tokenExpiry: tokens?.expires_at,
      isExpired: tokens?.expires_at ? Date.now() > tokens.expires_at : true
    });

    if (!tokens?.access_token) {
      throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
    }

    // Vérifier l'expiration avant d'utiliser le token
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      console.log('⏰ Token expiré détecté dans getAuthHeaders');
      this.clearTokens();
      throw new Error('Token d\'authentification expiré. Veuillez vous reconnecter.');
    }

    return {
      'Authorization': `Bearer ${tokens.access_token}`
    };
  }
}
