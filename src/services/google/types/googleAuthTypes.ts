
export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface StoredGoogleAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
  userEmail?: string;
}

export interface UserInfo {
  email: string;
  name: string;
}
