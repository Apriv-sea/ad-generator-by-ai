import { toast } from "sonner";
import { secureStorageService } from "@/services/security/secureStorageService";

interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface StoredGoogleAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
  userEmail?: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;
  private readonly STORAGE_KEY = 'google_auth_data';
  private readonly STATE_STORAGE_KEY = 'google_oauth_state';

  constructor() {
    // Détecter automatiquement l'environnement correct
    const currentOrigin = window.location.origin;
    console.log("Environnement détecté:", currentOrigin);
    
    this.config = {
      clientId: "135447600769-22vd8jk726t5f8gp58robppv0v8eeme7.apps.googleusercontent.com",
      redirectUri: `${currentOrigin}/auth/callback/google`,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    };

    console.log("Configuration OAuth Google mise à jour:", {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      currentOrigin
    });

    // Vérification critique pour debug
    console.log("URLs configurées:", {
      redirectUri: this.config.redirectUri,
      expectedInGoogleCloud: `${currentOrigin}/auth/callback/google`,
      match: this.config.redirectUri === `${currentOrigin}/auth/callback/google`
    });
  }

  // Vérifier si l'utilisateur est authentifié avec Google
  async isAuthenticated(): Promise<boolean> {
    const authData = this.getStoredAuth();
    if (!authData) return false;

    // Vérifier si le token n'est pas expiré
    if (Date.now() >= authData.expiresAt) {
      // Essayer de rafraîchir le token
      if (authData.refreshToken) {
        try {
          await this.refreshAccessToken();
          return true;
        } catch (error) {
          console.error("Erreur lors du rafraîchissement du token:", error);
          this.clearAuth();
          return false;
        }
      }
      return false;
    }

    // Valider le token avec Google
    return await this.validateToken(authData.accessToken);
  }

  // Obtenir le token d'accès valide
  async getValidAccessToken(): Promise<string | null> {
    const authData = this.getStoredAuth();
    if (!authData) return null;

    // Vérifier si le token expire bientôt (dans les 5 prochaines minutes)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() >= (authData.expiresAt - fiveMinutes)) {
      if (authData.refreshToken) {
        try {
          await this.refreshAccessToken();
          const refreshedAuth = this.getStoredAuth();
          return refreshedAuth?.accessToken || null;
        } catch (error) {
          console.error("Erreur lors du rafraîchissement préventif:", error);
          this.clearAuth();
          return null;
        }
      }
    }

    return authData.accessToken;
  }

  // Initier le processus d'authentification OAuth
  initiateAuth(): void {
    const state = secureStorageService.generateOAuthState();
    secureStorageService.setSecureItem(this.STATE_STORAGE_KEY, state, {
      encrypt: true,
      expiry: 10 * 60 * 1000 // 10 minutes
    });

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    console.log("Redirection vers Google OAuth avec URLs mises à jour:", {
      authUrl,
      redirectUri: this.config.redirectUri,
      state,
      currentOrigin: window.location.origin
    });
    
    window.location.href = authUrl;
  }

  // Traiter le callback OAuth avec logging amélioré
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      console.log("=== DEBUT DU TRAITEMENT CALLBACK ===");
      console.log("URL actuelle:", window.location.href);
      console.log("Origin actuel:", window.location.origin);
      console.log("Code reçu:", code?.substring(0, 10) + "...");
      console.log("State reçu:", state);
      console.log("Redirect URI configuré:", this.config.redirectUri);
      
      // Valider l'état OAuth
      const storedState = secureStorageService.getSecureItem(this.STATE_STORAGE_KEY, { encrypt: true });
      console.log("State stocké:", storedState);
      
      if (!storedState || storedState !== state) {
        console.error("ERREUR: État OAuth invalide:", { 
          storedState, 
          receivedState: state,
          match: storedState === state
        });
        toast.error("Erreur de sécurité détectée. Veuillez réessayer la connexion.");
        return false;
      }

      // Nettoyer l'état stocké
      secureStorageService.removeSecureItem(this.STATE_STORAGE_KEY);

      console.log("=== ECHANGE DU CODE CONTRE LES TOKENS ===");
      // Échanger le code d'autorisation contre des tokens
      const tokenData = await this.exchangeCodeForTokens(code);
      console.log("Tokens reçus avec succès");
      
      // Obtenir les informations utilisateur
      const userInfo = await this.getUserInfo(tokenData.access_token);
      console.log("Informations utilisateur récupérées:", userInfo.email);
      
      // Stocker les tokens de manière sécurisée
      const authData: StoredGoogleAuth = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        scopes: tokenData.scope.split(' '),
        userEmail: userInfo.email
      };

      this.storeAuth(authData);
      
      console.log("=== AUTHENTIFICATION REUSSIE ===");
      console.log("Email connecté:", userInfo.email);
      console.log("Scopes accordés:", tokenData.scope);
      
      toast.success(`Connecté à Google Sheets avec succès (${userInfo.email})`);
      return true;
    } catch (error) {
      console.error("=== ERREUR LORS DU TRAITEMENT DU CALLBACK ===");
      console.error("Erreur complète:", error);
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
      
      // Messages d'erreur plus spécifiques
      if (error.message?.includes('redirect_uri_mismatch')) {
        const expectedUri = this.config.redirectUri;
        console.error("ERREUR REDIRECT_URI_MISMATCH:");
        console.error("URI attendue:", expectedUri);
        console.error("Vérifiez que cette URI exacte est dans Google Cloud Console");
        toast.error(`Erreur de configuration: URI de redirection incorrecte. Attendue: ${expectedUri}`);
      } else if (error.message?.includes('invalid_client')) {
        toast.error("Client ID invalide. Vérifiez votre configuration Google Cloud.");
      } else {
        toast.error(`Erreur lors de la connexion: ${error.message}`);
      }
      return false;
    }
  }

  // Échanger le code d'autorisation contre des tokens avec logging détaillé
  private async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    console.log("=== ECHANGE CODE CONTRE TOKENS ===");
    console.log("Code à échanger:", code?.substring(0, 20) + "...");
    console.log("Client ID:", this.config.clientId);
    console.log("Redirect URI:", this.config.redirectUri);
    
    const requestBody = new URLSearchParams({
      client_id: this.config.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri
    });

    console.log("Corps de la requête:", requestBody.toString());
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    });

    console.log("Statut de la réponse:", response.status);
    console.log("Headers de la réponse:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.json();
      console.error("ERREUR LORS DE L'ECHANGE:", error);
      console.error("Détails de l'erreur:", {
        error: error.error,
        description: error.error_description,
        status: response.status
      });
      throw new Error(`Erreur lors de l'échange de tokens: ${error.error_description || error.error}`);
    }

    const tokenData = await response.json();
    console.log("Tokens obtenus avec succès:", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scopes: tokenData.scope
    });
    
    return tokenData;
  }

  // Rafraîchir le token d'accès
  private async refreshAccessToken(): Promise<void> {
    const authData = this.getStoredAuth();
    if (!authData?.refreshToken) {
      throw new Error("Pas de refresh token disponible");
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: '',
        refresh_token: authData.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur lors du rafraîchissement: ${error.error_description || error.error}`);
    }

    const tokenData: GoogleTokenResponse = await response.json();
    
    // Mettre à jour les données stockées
    const updatedAuthData: StoredGoogleAuth = {
      ...authData,
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      // Garder le refresh token existant si pas fourni dans la réponse
      refreshToken: tokenData.refresh_token || authData.refreshToken
    };

    this.storeAuth(updatedAuthData);
  }

  // Valider un token avec Google
  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      return response.ok;
    } catch (error) {
      console.error("Erreur lors de la validation du token:", error);
      return false;
    }
  }

  // Obtenir les informations utilisateur
  private async getUserInfo(token: string): Promise<{ email: string; name: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des informations utilisateur");
    }

    const userInfo = await response.json();
    return {
      email: userInfo.email,
      name: userInfo.name || userInfo.email
    };
  }

  // Stocker les données d'authentification de manière sécurisée
  private storeAuth(authData: StoredGoogleAuth): void {
    secureStorageService.setSecureItem(this.STORAGE_KEY, authData, {
      encrypt: true,
      expiry: authData.expiresAt - Date.now()
    });
  }

  // Récupérer les données d'authentification stockées
  private getStoredAuth(): StoredGoogleAuth | null {
    return secureStorageService.getSecureItem(this.STORAGE_KEY, { encrypt: true });
  }

  // Obtenir les informations de l'utilisateur connecté
  getAuthenticatedUser(): { email: string; scopes: string[] } | null {
    const authData = this.getStoredAuth();
    if (!authData) return null;

    return {
      email: authData.userEmail || 'Utilisateur Google',
      scopes: authData.scopes
    };
  }

  // Se déconnecter
  async signOut(): Promise<void> {
    const authData = this.getStoredAuth();
    
    // Révoquer le token chez Google
    if (authData?.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${authData.accessToken}`, {
          method: 'POST'
        });
      } catch (error) {
        console.error("Erreur lors de la révocation du token:", error);
      }
    }

    // Nettoyer le stockage local
    this.clearAuth();
    toast.success("Déconnecté de Google Sheets");
  }

  // Nettoyer les données d'authentification
  private clearAuth(): void {
    secureStorageService.removeSecureItem(this.STORAGE_KEY);
    secureStorageService.removeSecureItem(this.STATE_STORAGE_KEY);
    
    // Nettoyer aussi l'ancien stockage pour la migration
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_auth_state');
  }
}

export const googleAuthService = new GoogleAuthService();
