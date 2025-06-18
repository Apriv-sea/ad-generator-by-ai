
import { toast } from "sonner";
import { secureStorageService } from "@/services/security/secureStorageService";
import { googleAuthConfig } from "./config/googleAuthConfig";
import { googleTokenManager } from "./tokens/googleTokenManager";
import { googleAuthUtils } from "./utils/googleAuthUtils";
import { StoredGoogleAuth } from "./types/googleAuthTypes";

class GoogleAuthService {
  private readonly STATE_STORAGE_KEY = 'google_oauth_state';

  // Vérifier si l'utilisateur est authentifié avec Google
  async isAuthenticated(): Promise<boolean> {
    const authData = googleTokenManager.getStoredAuth();
    if (!authData) return false;

    // Vérifier si le token n'est pas expiré
    if (Date.now() >= authData.expiresAt) {
      // Essayer de rafraîchir le token
      if (authData.refreshToken) {
        try {
          await googleTokenManager.refreshAccessToken();
          return true;
        } catch (error) {
          console.error("Erreur lors du rafraîchissement du token:", error);
          googleTokenManager.clearAuth();
          return false;
        }
      }
      return false;
    }

    // Valider le token avec Google
    return await googleAuthUtils.validateToken(authData.accessToken);
  }

  // Obtenir le token d'accès valide
  async getValidAccessToken(): Promise<string | null> {
    return await googleTokenManager.getValidAccessToken();
  }

  // Initier le processus d'authentification OAuth
  initiateAuth(): void {
    const state = secureStorageService.generateOAuthState();
    secureStorageService.setSecureItem(this.STATE_STORAGE_KEY, state, {
      encrypt: true,
      expiry: 10 * 60 * 1000 // 10 minutes
    });

    const authUrl = googleAuthConfig.getAuthUrl(state);
    
    console.log("Redirection vers Google OAuth avec URLs mises à jour:", {
      authUrl,
      redirectUri: googleAuthConfig.getConfig().redirectUri,
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
      console.log("Redirect URI configuré:", googleAuthConfig.getConfig().redirectUri);
      
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
      const tokenData = await googleTokenManager.exchangeCodeForTokens(code);
      console.log("Tokens reçus avec succès");
      
      // Obtenir les informations utilisateur
      const userInfo = await googleAuthUtils.getUserInfo(tokenData.access_token);
      console.log("Informations utilisateur récupérées:", userInfo.email);
      
      // Stocker les tokens de manière sécurisée
      const authData: StoredGoogleAuth = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        scopes: tokenData.scope.split(' '),
        userEmail: userInfo.email
      };

      googleTokenManager.storeAuth(authData);
      
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
        const expectedUri = googleAuthConfig.getConfig().redirectUri;
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

  // Obtenir les informations de l'utilisateur connecté
  getAuthenticatedUser(): { email: string; scopes: string[] } | null {
    const authData = googleTokenManager.getStoredAuth();
    if (!authData) return null;

    return {
      email: authData.userEmail || 'Utilisateur Google',
      scopes: authData.scopes
    };
  }

  // Se déconnecter
  async signOut(): Promise<void> {
    const authData = googleTokenManager.getStoredAuth();
    
    // Révoquer le token chez Google
    if (authData?.accessToken) {
      await googleAuthUtils.revokeToken(authData.accessToken);
    }

    // Nettoyer le stockage local
    this.clearAuth();
    toast.success("Déconnecté de Google Sheets");
  }

  // Nettoyer les données d'authentification
  private clearAuth(): void {
    googleTokenManager.clearAuth();
    secureStorageService.removeSecureItem(this.STATE_STORAGE_KEY);
  }
}

export const googleAuthService = new GoogleAuthService();
