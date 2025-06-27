
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
  
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Enhanced security constants
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const MAX_RETRY_ATTEMPTS = 3;

  const logSecurityEvent = (event: string, details?: any) => {
    console.log(`🔒 Security Event: ${event}`, {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      details
    });
  };

  const resetFailedAttempts = () => {
    localStorage.removeItem('auth_failed_attempts');
  };

  const handleSignOut = async () => {
    try {
      logSecurityEvent('USER_SIGNOUT');
      await supabase.auth.signOut();
      
      // Clear sensitive data
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
      
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('google_auth_state');
      
      setSuspiciousActivity(false);
      setRetryCount(0);
      
    } catch (error) {
      console.error("Error signing out:", error);
      logSecurityEvent('SIGNOUT_ERROR', { error: error.message });
    }
  };

  const updateActivity = () => {
    if (!mountedRef.current) return;
    setLastActivity(Date.now());
    if (retryCount > 0) {
      setRetryCount(0);
    }
    if (suspiciousActivity) {
      setSuspiciousActivity(false);
    }
  };

  // Single useEffect for complete auth setup
  useEffect(() => {
    mountedRef.current = true;
    let cleanup = false;

    const initAuth = async () => {
      if (cleanup) return;

      try {
        // Set up auth state listener first
        if (!authSubscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (cleanup || !mountedRef.current) return;
              
              console.log("Auth state changed:", event);
              logSecurityEvent('AUTH_STATE_CHANGE', { event });
              
              // Handle different auth events
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
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cleanup) return;

        if (error) {
          console.error("Session error:", error);
          logSecurityEvent('SESSION_ERROR', { error: error.message });
          
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log("Invalid refresh token detected, clearing session");
            await handleSignOut();
          }
        } else {
          setSession(session);
          setUser(session?.user || null);
          
          if (session?.user) {
            setLastActivity(Date.now());
            localStorage.setItem('auth_connected', 'true');
            resetFailedAttempts();
          }
        }
        
      } catch (error) {
        if (cleanup) return;
        console.error("Error initializing authentication:", error);
        logSecurityEvent('AUTH_INIT_ERROR', { error: error.message });
        
        if (error?.message?.includes('refresh_token_not_found')) {
          await handleSignOut();
        }
      } finally {
        if (!cleanup && mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Set up activity monitoring
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up session timeout check
    const checkSessionTimeout = () => {
      if (cleanup) return;
      const now = Date.now();
      if (session && (now - lastActivity > SESSION_TIMEOUT)) {
        console.log("Session expired due to inactivity");
        logSecurityEvent('SESSION_TIMEOUT');
        toast.info("Session expirée. Veuillez vous reconnecter.");
        handleSignOut();
      }
    };

    activityTimeoutRef.current = setInterval(checkSessionTimeout, 60000);

    // Initialize auth
    initAuth();

    // Cleanup function
    return () => {
      cleanup = true;
      mountedRef.current = false;
      
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
      
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - runs only once

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
      toast.error("Erreur lors du rafraîchissement de la session");
    }
  };

  const secureSignOut = async () => {
    try {
      logSecurityEvent('MANUAL_SIGNOUT');
      await supabase.auth.signOut();
      
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
