
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { toast } from "sonner";

export function useSecureAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState<number>(0);
  const [suspiciousActivity, setSuspiciousActivity] = useState<boolean>(false);

  // Use refs to prevent unnecessary re-renders
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityListenersSetup = useRef<boolean>(false);
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const securityCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced security constants
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000;
  const SECURITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const MAX_FAILED_ATTEMPTS = 5;

  const logSecurityEvent = (event: string, details?: any) => {
    console.log(`🔒 Security Event: ${event}`, {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      details
    });
  };

  const detectSuspiciousActivity = () => {
    const failedAttempts = parseInt(localStorage.getItem('auth_failed_attempts') || '0');
    
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      setSuspiciousActivity(true);
      logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', { failedAttempts });
      toast.error("Activité suspecte détectée. Veuillez vous reconnecter.");
      handleSignOut();
      return true;
    }
    
    return false;
  };

  const incrementFailedAttempts = () => {
    const current = parseInt(localStorage.getItem('auth_failed_attempts') || '0');
    localStorage.setItem('auth_failed_attempts', (current + 1).toString());
  };

  const resetFailedAttempts = () => {
    localStorage.removeItem('auth_failed_attempts');
  };

  const handleTokenRefreshError = async () => {
    incrementFailedAttempts();
    
    if (detectSuspiciousActivity()) {
      return;
    }

    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.log(`Token refresh failed, retrying... (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      setRetryCount(prev => prev + 1);
      
      setTimeout(async () => {
        try {
          const { error } = await supabase.auth.refreshSession();
          if (error) throw error;
          
          console.log("Token refresh retry successful");
          setRetryCount(0);
          resetFailedAttempts();
          logSecurityEvent('TOKEN_REFRESH_SUCCESS');
        } catch (error) {
          console.error("Token refresh retry failed:", error);
          if (retryCount + 1 >= MAX_RETRY_ATTEMPTS) {
            console.log("Max retry attempts reached, signing out");
            logSecurityEvent('MAX_RETRY_ATTEMPTS_REACHED');
            toast.error("Erreur de session persistante. Veuillez vous reconnecter.");
            handleSignOut();
          }
        }
      }, RETRY_DELAY * retryCount);
    }
  };

  const handleSignOut = async () => {
    try {
      logSecurityEvent('USER_SIGNOUT');
      await supabase.auth.signOut();
      
      // Enhanced cleanup - clear all sensitive data
      const keysToRemove = [
        'auth_connected',
        'user_data',
        'google_user',
        'auth_failed_attempts'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear session storage OAuth states
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('google_auth_state');
      
      // Reset security state
      setSuspiciousActivity(false);
      setRetryCount(0);
      
    } catch (error) {
      console.error("Error signing out:", error);
      logSecurityEvent('SIGNOUT_ERROR', { error: error.message });
    }
  };

  const checkSessionValidity = () => {
    const now = Date.now();
    if (session && (now - lastActivity > SESSION_TIMEOUT)) {
      console.log("Session expired due to inactivity");
      logSecurityEvent('SESSION_TIMEOUT');
      toast.info("Session expirée. Veuillez vous reconnecter.");
      handleSignOut();
    }
  };

  const performSecurityCheck = () => {
    if (!session) return;
    
    // Check for session integrity
    const storedAuth = localStorage.getItem('auth_connected');
    if (session && !storedAuth) {
      logSecurityEvent('SESSION_INTEGRITY_VIOLATION');
      console.warn("Session integrity violation detected");
      handleSignOut();
      return;
    }
    
    // Check for suspicious activity patterns
    detectSuspiciousActivity();
  };

  const updateActivity = () => {
    setLastActivity(Date.now());
    if (retryCount > 0) {
      setRetryCount(0);
    }
    if (suspiciousActivity) {
      setSuspiciousActivity(false);
    }
  };

  // Initialize auth only once
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (!authSubscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (!mounted) return;
              
              console.log("Auth state changed:", event);
              logSecurityEvent('AUTH_STATE_CHANGE', { event });
              
              if (event === 'TOKEN_REFRESHED' && session) {
                console.log("Token refreshed successfully");
                setLastActivity(Date.now());
                setRetryCount(0);
                resetFailedAttempts();
                logSecurityEvent('TOKEN_REFRESH_SUCCESS');
              } else if (event === 'SIGNED_IN' && session?.user) {
                console.log("User signed in:", session.user.id);
                setLastActivity(Date.now());
                setRetryCount(0);
                resetFailedAttempts();
                localStorage.setItem('auth_connected', 'true');
                
                logSecurityEvent('USER_SIGNIN', {
                  userId: session.user.id,
                  provider: session.user.app_metadata?.provider
                });
              } else if (event === 'SIGNED_OUT') {
                console.log("User signed out");
                logSecurityEvent('USER_SIGNOUT');
                localStorage.removeItem('auth_connected');
                localStorage.removeItem('user_data');
                sessionStorage.removeItem('oauth_state');
                sessionStorage.removeItem('google_auth_state');
              }
              
              setSession(session);
              setUser(session?.user || null);
            }
          );
          
          authSubscriptionRef.current = subscription;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          logSecurityEvent('SESSION_ERROR', { error: error.message });
          
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log("Invalid refresh token detected, clearing session");
            await handleSignOut();
          }
        } else {
          if (mounted) {
            setSession(session);
            setUser(session?.user || null);
            
            if (session?.user) {
              setLastActivity(Date.now());
              localStorage.setItem('auth_connected', 'true');
              resetFailedAttempts();
            }
          }
        }
        
      } catch (error) {
        console.error("Error initializing authentication:", error);
        logSecurityEvent('AUTH_INIT_ERROR', { error: error.message });
        
        if (error?.message?.includes('refresh_token_not_found')) {
          await handleSignOut();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, []);

  // Set up activity monitoring and security checks
  useEffect(() => {
    if (activityListenersSetup.current) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up session check timer
    sessionTimeoutRef.current = setInterval(checkSessionValidity, 60000);
    
    // Set up security check timer
    securityCheckRef.current = setInterval(performSecurityCheck, SECURITY_CHECK_INTERVAL);

    activityListenersSetup.current = true;

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
      }
      if (securityCheckRef.current) {
        clearInterval(securityCheckRef.current);
      }
      activityListenersSetup.current = false;
    };
  }, [session?.user?.id]);

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setLastActivity(Date.now());
      setRetryCount(0);
      resetFailedAttempts();
      logSecurityEvent('MANUAL_SESSION_REFRESH');
    } catch (error) {
      console.error("Error refreshing session:", error);
      logSecurityEvent('SESSION_REFRESH_ERROR', { error: error.message });
      
      if (error?.message?.includes('refresh_token_not_found')) {
        handleTokenRefreshError();
      } else {
        toast.error("Erreur lors du rafraîchissement de la session");
      }
    }
  };

  const secureSignOut = async () => {
    try {
      logSecurityEvent('MANUAL_SIGNOUT');
      await supabase.auth.signOut();
      
      // Enhanced security cleanup
      localStorage.clear();
      sessionStorage.clear();
      
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Error during secure sign out:", error);
      logSecurityEvent('SIGNOUT_ERROR', { error: error.message });
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user && !suspiciousActivity,
    lastActivity,
    refreshSession,
    secureSignOut,
    retryCount,
    suspiciousActivity
  };
}
