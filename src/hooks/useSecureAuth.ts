
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

  // Use refs to prevent unnecessary re-renders
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityListenersSetup = useRef<boolean>(false);
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Session timeout (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000;

  const handleTokenRefreshError = async () => {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.log(`Token refresh failed, retrying... (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      setRetryCount(prev => prev + 1);
      
      setTimeout(async () => {
        try {
          const { error } = await supabase.auth.refreshSession();
          if (error) throw error;
          console.log("Token refresh retry successful");
          setRetryCount(0);
        } catch (error) {
          console.error("Token refresh retry failed:", error);
          if (retryCount + 1 >= MAX_RETRY_ATTEMPTS) {
            console.log("Max retry attempts reached, signing out");
            toast.error("Erreur de session persistante. Veuillez vous reconnecter.");
            handleSignOut();
          }
        }
      }, RETRY_DELAY * retryCount);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear all sensitive data
      localStorage.removeItem('auth_connected');
      localStorage.removeItem('user_data');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('google_auth_state');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const checkSessionValidity = () => {
    const now = Date.now();
    if (session && (now - lastActivity > SESSION_TIMEOUT)) {
      console.log("Session expired due to inactivity");
      toast.info("Session expirée. Veuillez vous reconnecter.");
      handleSignOut();
    }
  };

  const updateActivity = () => {
    setLastActivity(Date.now());
    if (retryCount > 0) {
      setRetryCount(0); // Reset retry count on user activity
    }
  };

  // Initialize auth only once
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Set up auth state listener with enhanced error handling
        if (!authSubscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (!mounted) return;
              
              console.log("Auth state changed:", event);
              
              // Enhanced security logging
              if (event === 'TOKEN_REFRESHED' && session) {
                console.log("Token refreshed successfully");
                setLastActivity(Date.now());
                setRetryCount(0);
              } else if (event === 'SIGNED_IN' && session?.user) {
                console.log("User signed in:", session.user.id);
                setLastActivity(Date.now());
                setRetryCount(0);
                localStorage.setItem('auth_connected', 'true');
                
                // Security audit log
                console.log("Security audit: User authentication successful", {
                  userId: session.user.id,
                  timestamp: new Date().toISOString(),
                  provider: session.user.app_metadata?.provider
                });
              } else if (event === 'SIGNED_OUT') {
                console.log("User signed out");
                localStorage.removeItem('auth_connected');
                localStorage.removeItem('user_data');
                
                // Clear sensitive data from sessionStorage
                sessionStorage.removeItem('oauth_state');
                sessionStorage.removeItem('google_auth_state');
              }
              
              setSession(session);
              setUser(session?.user || null);
            }
          );
          
          authSubscriptionRef.current = subscription;
        }
        
        // Check for existing session with error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
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
            }
          }
        }
        
      } catch (error) {
        console.error("Error initializing authentication:", error);
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
  }, []); // Remove all dependencies to prevent re-initialization

  // Set up activity monitoring separately
  useEffect(() => {
    if (activityListenersSetup.current) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up session check timer
    sessionTimeoutRef.current = setInterval(checkSessionValidity, 60000); // Check every minute

    activityListenersSetup.current = true;

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
      }
      activityListenersSetup.current = false;
    };
  }, [session?.user?.id]); // Only depend on user ID change

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setLastActivity(Date.now());
      setRetryCount(0);
    } catch (error) {
      console.error("Error refreshing session:", error);
      if (error?.message?.includes('refresh_token_not_found')) {
        handleTokenRefreshError();
      } else {
        toast.error("Erreur lors du rafraîchissement de la session");
      }
    }
  };

  const secureSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Additional security cleanup
      localStorage.clear();
      sessionStorage.clear();
      
      // Security audit log
      console.log("Security audit: User signed out", {
        timestamp: new Date().toISOString(),
        reason: 'manual_logout'
      });
      
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Error during secure sign out:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    lastActivity,
    refreshSession,
    secureSignOut,
    retryCount
  };
}
