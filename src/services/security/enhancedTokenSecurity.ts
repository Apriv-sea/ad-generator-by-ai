import { supabase } from '@/integrations/supabase/client';
import { secureStorageService } from './secureStorageService';

/**
 * Enhanced token security service to prevent XSS attacks
 */
export class EnhancedTokenSecurity {
  private static readonly TOKEN_KEY = 'secure_auth_tokens';
  private static readonly SESSION_KEY = 'secure_session_data';
  
  /**
   * Securely store authentication tokens
   */
  static storeTokens(tokens: { access_token?: string; refresh_token?: string }) {
    // Use sessionStorage with encryption for tokens
    secureStorageService.setSecureItem(this.TOKEN_KEY, tokens, {
      encrypt: true,
      expiry: 60 * 60 * 1000 // 1 hour
    });
  }
  
  /**
   * Retrieve and validate stored tokens
   */
  static getTokens(): { access_token?: string; refresh_token?: string } | null {
    return secureStorageService.getSecureItem(this.TOKEN_KEY, { encrypt: true });
  }
  
  /**
   * Store session data securely
   */
  static storeSessionData(sessionData: any) {
    // Remove sensitive data before storing
    const sanitizedData = {
      user_id: sessionData.user?.id,
      email: sessionData.user?.email,
      // Don't store access_token or sensitive auth data
      expires_at: sessionData.expires_at
    };
    
    secureStorageService.setSecureItem(this.SESSION_KEY, sanitizedData, {
      encrypt: true,
      expiry: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  
  /**
   * Clear all stored tokens and session data
   */
  static clearAllTokens() {
    secureStorageService.removeSecureItem(this.TOKEN_KEY);
    secureStorageService.removeSecureItem(this.SESSION_KEY);
    secureStorageService.clearSensitiveData();
    
    // Also clear any tokens that might be in localStorage (legacy cleanup)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('token') || key.includes('auth') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
  
  /**
   * Validate token integrity and refresh if needed
   */
  static async validateAndRefreshTokens(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Token validation error:', error);
        this.clearAllTokens();
        return false;
      }
      
      if (session) {
        // Store refreshed tokens securely
        this.storeTokens({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        this.storeSessionData(session);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.clearAllTokens();
      return false;
    }
  }
  
  /**
   * Check for token tampering or XSS attempts
   */
  static detectTokenTampering(): boolean {
    const storedTokens = this.getTokens();
    if (!storedTokens) return false;
    
    // Check for suspicious token patterns that might indicate XSS
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /<iframe/i,
      /eval\(/i
    ];
    
    const tokenString = JSON.stringify(storedTokens);
    return suspiciousPatterns.some(pattern => pattern.test(tokenString));
  }
}