
import { toast } from "sonner";

interface SecureStorageOptions {
  encrypt?: boolean;
  expiry?: number; // in milliseconds
}

class SecureStorageService {
  private readonly storageKey = 'secure_app_data';
  
  // Simple encryption for demo purposes - in production, use proper crypto libraries
  private encrypt(data: string): string {
    try {
      return btoa(data);
    } catch {
      return data;
    }
  }
  
  private decrypt(data: string): string {
    try {
      return atob(data);
    } catch {
      return data;
    }
  }
  
  setSecureItem(key: string, value: any, options: SecureStorageOptions = {}): void {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiry: options.expiry ? Date.now() + options.expiry : null
      };
      
      const serialized = JSON.stringify(data);
      const finalValue = options.encrypt ? this.encrypt(serialized) : serialized;
      
      // Use sessionStorage for ALL sensitive data including tokens
      if (key.includes('oauth') || key.includes('auth_state') || key.includes('token') || key.includes('session')) {
        sessionStorage.setItem(key, finalValue);
      } else {
        // Only use localStorage for non-sensitive UI preferences
        localStorage.setItem(key, finalValue);
      }
    } catch (error) {
      console.error('Secure storage set error:', error);
    }
  }
  
  getSecureItem(key: string, options: SecureStorageOptions = {}): any {
    try {
      // Check both storage types
      let stored = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (!stored) return null;
      
      const decrypted = options.encrypt ? this.decrypt(stored) : stored;
      const data = JSON.parse(decrypted);
      
      // Check expiry
      if (data.expiry && Date.now() > data.expiry) {
        this.removeSecureItem(key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }
  
  removeSecureItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Secure storage remove error:', error);
    }
  }
  
  // Generate secure OAuth state
  generateOAuthState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Store OAuth state securely with expiry
  setOAuthState(state: string): void {
    this.setSecureItem('oauth_state', state, {
      encrypt: true,
      expiry: 10 * 60 * 1000 // 10 minutes
    });
  }
  
  // Validate and retrieve OAuth state
  validateOAuthState(receivedState: string): boolean {
    const storedState = this.getSecureItem('oauth_state', { encrypt: true });
    this.removeSecureItem('oauth_state'); // Single use
    
    if (!storedState || storedState !== receivedState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      toast.error('Erreur de sécurité détectée. Veuillez réessayer.');
      return false;
    }
    
    return true;
  }
  
  // Clear all sensitive data
  clearSensitiveData(): void {
    const sensitiveKeys = [
      'oauth_state',
      'google_auth_state',
      'auth_tokens',
      'user_session'
    ];
    
    sensitiveKeys.forEach(key => this.removeSecureItem(key));
  }
}

export const secureStorageService = new SecureStorageService();
