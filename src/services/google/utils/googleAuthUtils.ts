
import { UserInfo } from "../types/googleAuthTypes";

export class GoogleAuthUtils {
  // Valider un token avec Google
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      return response.ok;
    } catch (error) {
      console.error("Erreur lors de la validation du token:", error);
      return false;
    }
  }

  // Obtenir les informations utilisateur
  async getUserInfo(token: string): Promise<UserInfo> {
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

  // Révoquer un token chez Google
  async revokeToken(token: string): Promise<void> {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error("Erreur lors de la révocation du token:", error);
    }
  }
}

export const googleAuthUtils = new GoogleAuthUtils();
