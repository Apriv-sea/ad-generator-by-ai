import { toast } from "sonner";
import { SecurityMonitoringService } from "./securityMonitoringService";

interface SecureStorageItem {
  value: string;
  timestamp: number;
  expiry?: number;
  encrypted: boolean;
  checksum: string;
}

interface SecureStorageOptions {
  encrypt?: boolean;
  expiry?: number; // in milliseconds
  sensitive?: boolean; // if true, uses sessionStorage
}

class EnhancedSecureStorage {
  private readonly storageKey = 'secure_app_data';
  private readonly encryptionKey: string;
  
  constructor() {
    // Generate a session-specific encryption key
    this.encryptionKey = this.generateSessionKey();
  }
  
  private generateSessionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  private async encrypt(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.encryptionKey);
      const dataBuffer = encoder.encode(data);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData.slice(0, 32),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );
      
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to plain text if encryption fails
    }
  }
  
  private async decrypt(encryptedData: string): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.encryptionKey);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData.slice(0, 32),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Fallback if decryption fails
    }
  }
  
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  async setSecureItem(key: string, value: any, options: SecureStorageOptions = {}): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = options.encrypt !== false ? await this.encrypt(serialized) : serialized;
      
      const item: SecureStorageItem = {
        value: encrypted,
        timestamp: Date.now(),
        expiry: options.expiry ? Date.now() + options.expiry : undefined,
        encrypted: options.encrypt !== false,
        checksum: this.generateChecksum(serialized)
      };
      
      const storage = options.sensitive || key.includes('token') || key.includes('auth') 
        ? sessionStorage 
        : localStorage;
        
      storage.setItem(key, JSON.stringify(item));
      
      // Log access for security monitoring
      if (options.sensitive || key.includes('auth')) {
        await SecurityMonitoringService.logSecurityEvent({
          event_type: 'secure_storage_write',
          user_id: crypto.randomUUID(), // Will be replaced with actual user ID
          details: { key: key.substring(0, 10) + '...', encrypted: item.encrypted },
          risk_level: 'low',
          page_url: window.location.href,
          user_agent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('Secure storage set error:', error);
      toast.error('Erreur de stockage sécurisé');
    }
  }
  
  async getSecureItem(key: string): Promise<any> {
    try {
      const stored = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (!stored) return null;
      
      const item: SecureStorageItem = JSON.parse(stored);
      
      // Check expiry
      if (item.expiry && Date.now() > item.expiry) {
        this.removeSecureItem(key);
        return null;
      }
      
      const decrypted = item.encrypted ? await this.decrypt(item.value) : item.value;
      const parsed = JSON.parse(decrypted);
      
      // Verify checksum for integrity
      const expectedChecksum = this.generateChecksum(decrypted);
      if (item.checksum !== expectedChecksum) {
        console.warn('Data integrity check failed for key:', key);
        await SecurityMonitoringService.logSuspiciousActivity(
          'Data integrity violation detected',
          { key: key.substring(0, 10) + '...', expected: expectedChecksum, actual: item.checksum }
        );
        this.removeSecureItem(key);
        return null;
      }
      
      return parsed;
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
  
  // Enhanced OAuth state management
  async setOAuthState(state: string): Promise<void> {
    await this.setSecureItem('oauth_state', state, {
      encrypt: true,
      expiry: 10 * 60 * 1000, // 10 minutes
      sensitive: true
    });
  }
  
  async validateOAuthState(receivedState: string): Promise<boolean> {
    const storedState = await this.getSecureItem('oauth_state');
    this.removeSecureItem('oauth_state'); // Single use
    
    if (!storedState || storedState !== receivedState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      await SecurityMonitoringService.logSuspiciousActivity(
        'OAuth state mismatch - possible CSRF attack',
        { expected: storedState?.substring(0, 10) + '...', received: receivedState?.substring(0, 10) + '...' }
      );
      toast.error('Erreur de sécurité détectée. Veuillez réessayer.');
      return false;
    }
    
    return true;
  }
  
  // Secure session token management
  async setSessionToken(token: string, userId: string): Promise<void> {
    await this.setSecureItem('session_token', {
      token,
      userId,
      timestamp: Date.now()
    }, {
      encrypt: true,
      expiry: 24 * 60 * 60 * 1000, // 24 hours
      sensitive: true
    });
  }
  
  async getSessionToken(): Promise<{ token: string; userId: string } | null> {
    return await this.getSecureItem('session_token');
  }
  
  // Clear all sensitive data
  async clearSensitiveData(): Promise<void> {
    const sensitiveKeys = [
      'oauth_state',
      'google_auth_state', 
      'session_token',
      'auth_tokens',
      'user_session',
      'api_keys'
    ];
    
    sensitiveKeys.forEach(key => this.removeSecureItem(key));
    
    await SecurityMonitoringService.logSecurityEvent({
      event_type: 'sensitive_data_cleared',
      user_id: crypto.randomUUID(),
      details: { keys_cleared: sensitiveKeys.length },
      risk_level: 'low',
      page_url: window.location.href,
      user_agent: navigator.userAgent
    });
  }
  
  // Security audit - list all stored keys (for debugging)
  auditStoredKeys(): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(`localStorage: ${key}`);
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) keys.push(`sessionStorage: ${key}`);
    }
    
    return keys;
  }
}

export const enhancedSecureStorage = new EnhancedSecureStorage();