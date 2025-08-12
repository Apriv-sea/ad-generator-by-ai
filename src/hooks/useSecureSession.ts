import { useState, useEffect, useCallback } from 'react';
import { SessionSecurityService } from '@/services/security/sessionSecurityService';
import { SecurityMonitoringService } from '@/services/security/securityMonitoringService';

export interface SecureSessionState {
  sessionToken: string | null;
  isSessionValid: boolean;
  lastActivity: Date | null;
  suspiciousActivity: boolean;
}

export function useSecureSession() {
  const [sessionState, setSessionState] = useState<SecureSessionState>({
    sessionToken: null,
    isSessionValid: false,
    lastActivity: null,
    suspiciousActivity: false
  });

  // Create a new session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const token = await SessionSecurityService.createSession();
        setSessionState(prev => ({
          ...prev,
          sessionToken: token,
          isSessionValid: true,
          lastActivity: new Date()
        }));
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initializeSession();
  }, []);

  // Update activity periodically
  const updateActivity = useCallback(async () => {
    if (sessionState.sessionToken) {
      await SessionSecurityService.updateActivity(sessionState.sessionToken);
      setSessionState(prev => ({
        ...prev,
        lastActivity: new Date()
      }));

      // Check for suspicious activity
      const suspicious = await SessionSecurityService.detectSuspiciousActivity(sessionState.sessionToken);
      if (suspicious) {
        setSessionState(prev => ({ ...prev, suspiciousActivity: true }));
        await SecurityMonitoringService.logSuspiciousActivity('Multiple active sessions detected');
      }
    }
  }, [sessionState.sessionToken]);

  // Validate session periodically
  const validateSession = useCallback(async () => {
    if (sessionState.sessionToken) {
      const isValid = await SessionSecurityService.validateSession(sessionState.sessionToken);
      setSessionState(prev => ({
        ...prev,
        isSessionValid: isValid
      }));

      if (!isValid) {
        await SecurityMonitoringService.logSuspiciousActivity('Session validation failed');
      }
    }
  }, [sessionState.sessionToken]);

  // Set up activity monitoring
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Validate session every 5 minutes
    const validationInterval = setInterval(validateSession, 5 * 60 * 1000);

    return () => {
      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(validationInterval);
    };
  }, [updateActivity, validateSession]);

  // Invalidate session
  const invalidateSession = useCallback(async () => {
    if (sessionState.sessionToken) {
      await SessionSecurityService.invalidateSession(sessionState.sessionToken);
      setSessionState({
        sessionToken: null,
        isSessionValid: false,
        lastActivity: null,
        suspiciousActivity: false
      });
    }
  }, [sessionState.sessionToken]);

  // Invalidate all sessions
  const invalidateAllSessions = useCallback(async () => {
    await SessionSecurityService.invalidateAllUserSessions();
    setSessionState({
      sessionToken: null,
      isSessionValid: false,
      lastActivity: null,
      suspiciousActivity: false
    });
  }, []);

  return {
    ...sessionState,
    updateActivity,
    validateSession,
    invalidateSession,
    invalidateAllSessions
  };
}