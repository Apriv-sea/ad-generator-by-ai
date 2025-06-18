
import { GoogleTokenResponse, StoredGoogleAuth } from "../types/googleAuthTypes";
import { secureStorageService } from "@/services/security/secureStorageService";
import { googleAuthConfig } from "../config/googleAuthConfig";

export class GoogleTokenManager {
  private readonly STORAGE_KEY = 'google_auth_data';

  // Échanger le code d'autorisation contre des tokens avec logging détaillé
  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    console.log("=== ECHANGE CODE CONTRE TOKENS ===");
    console.log("Code à échanger:", code?.substring(0, 20) + "...");
    
    const config = googleAuthConfig.getConfig();
    console.log("Client ID:", config.clientId);
    console.log("Redirect URI:", config.redirectUri);
    
    const requestBody = new URLSearchParams({
      client_id: config.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
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
  async refreshAccessToken(): Promise<void> {
    const authData = this.getStoredAuth();
    if (!authData?.refreshToken) {
      throw new Error("Pas de refresh token disponible");
    }

    const config = googleAuthConfig.getConfig();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
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

  // Stocker les données d'authentification de manière sécurisée
  storeAuth(authData: StoredGoogleAuth): void {
    secureStorageService.setSecureItem(this.STORAGE_KEY, authData, {
      encrypt: true,
      expiry: authData.expiresAt - Date.now()
    });
  }

  // Récupérer les données d'authentification stockées
  getStoredAuth(): StoredGoogleAuth | null {
    return secureStorageService.getSecureItem(this.STORAGE_KEY, { encrypt: true });
  }

  // Nettoyer les données d'authentification
  clearAuth(): void {
    secureStorageService.removeSecureItem(this.STORAGE_KEY);
    
    // Nettoyer aussi l'ancien stockage pour la migration
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_auth_state');
  }
}

export const googleTokenManager = new GoogleTokenManager();
