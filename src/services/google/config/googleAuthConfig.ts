
import { GoogleAuthConfig } from "../types/googleAuthTypes";

export class GoogleAuthConfigManager {
  private config: GoogleAuthConfig;

  constructor() {
    // Détecter automatiquement l'environnement correct
    const currentOrigin = window.location.origin;
    console.log("Environnement détecté:", currentOrigin);
    
    this.config = {
      clientId: "135447600769-22vd8jk726t5f8gp58robppv0v8eeme7.apps.googleusercontent.com",
      // Corriger l'URL de redirection pour correspondre au routage de l'app
      redirectUri: `${currentOrigin}/auth/callback`,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    };

    console.log("Configuration OAuth Google corrigée:", {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      currentOrigin
    });

    // Vérification critique pour debug
    console.log("URLs configurées:", {
      redirectUri: this.config.redirectUri,
      expectedInGoogleCloud: `${currentOrigin}/auth/callback`,
      match: this.config.redirectUri === `${currentOrigin}/auth/callback`
    });
  }

  getConfig(): GoogleAuthConfig {
    return this.config;
  }

  getAuthUrl(state: string): string {
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
    console.log("URL d'authentification générée:", authUrl);
    return authUrl;
  }
}

export const googleAuthConfig = new GoogleAuthConfigManager();
