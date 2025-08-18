import { useCallback, useEffect } from 'react';
import { enhancedSecureStorage } from '@/services/security/enhancedSecureStorage';
import { SecurityMonitoringService } from '@/services/security/securityMonitoringService';
import { toast } from 'sonner';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
}

export function useSecureTokenStorage() {
  // Store tokens securely (never in localStorage)
  const storeTokens = useCallback(async (tokens: TokenData) => {
    try {
      // Always use sessionStorage for auth tokens
      await enhancedSecureStorage.setSecureItem('auth_tokens', tokens, {
        encrypt: true,
        expiry: tokens.expires_at * 1000, // Convert to milliseconds
        sensitive: true // Forces sessionStorage usage
      });
      
      await SecurityMonitoringService.logDataAccess('auth_tokens', 'store');
    } catch (error) {
      console.error('Failed to store tokens securely:', error);
      toast.error('Erreur de sécurité lors de la sauvegarde des tokens');
    }
  }, []);
  
  // Retrieve tokens securely
  const getTokens = useCallback(async (): Promise<TokenData | null> => {
    try {
      const tokens = await enhancedSecureStorage.getSecureItem('auth_tokens');
      
      if (tokens) {
        // Validate token structure
        if (!tokens.access_token || !tokens.user_id) {
          console.warn('Invalid token structure detected');
          await SecurityMonitoringService.logSuspiciousActivity(
            'Invalid token structure detected',
            { hasAccessToken: !!tokens.access_token, hasUserId: !!tokens.user_id }
          );
          clearTokens();
          return null;
        }
        
        // Check if token is expired
        if (tokens.expires_at && Date.now() > tokens.expires_at * 1000) {
          console.log('Token expired, clearing');
          clearTokens();
          return null;
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }, []);
  
  // Clear tokens securely
  const clearTokens = useCallback(async () => {
    try {
      enhancedSecureStorage.removeSecureItem('auth_tokens');
      await SecurityMonitoringService.logDataAccess('auth_tokens', 'clear');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }, []);
  
  // Validate token integrity periodically
  const validateTokens = useCallback(async (): Promise<boolean> => {
    const tokens = await getTokens();
    
    if (!tokens) {
      return false;
    }
    
    // Additional security checks
    try {
      // Decode JWT to check structure (without verification - just basic structure)
      const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
      
      if (!payload.sub || payload.sub !== tokens.user_id) {
        await SecurityMonitoringService.logSuspiciousActivity(
          'Token user ID mismatch',
          { tokenUserId: payload.sub, storedUserId: tokens.user_id }
        );
        clearTokens();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      await SecurityMonitoringService.logSuspiciousActivity(
        'Token validation failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      clearTokens();
      return false;
    }
  }, [getTokens, clearTokens]);
  
  // Auto-cleanup expired tokens
  useEffect(() => {
    const interval = setInterval(async () => {
      const tokens = await getTokens();
      if (tokens && tokens.expires_at && Date.now() > tokens.expires_at * 1000) {
        console.log('Auto-clearing expired tokens');
        clearTokens();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [getTokens, clearTokens]);
  
  // Enhanced session cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Clear all sensitive data before page unload
      await enhancedSecureStorage.clearSensitiveData();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  return {
    storeTokens,
    getTokens,
    clearTokens,
    validateTokens
  };
}