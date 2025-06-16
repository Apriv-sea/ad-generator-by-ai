
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { toast } from "sonner";

export function useSecureAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Session timeout (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    let activityTimer: NodeJS.Timeout | null = null;

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
    };

    const initAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log("Auth state changed:", event);
            setSession(session);
            setUser(session?.user || null);
            
            if (event === 'SIGNED_IN' && session?.user) {
              setLastActivity(Date.now());
              localStorage.setItem('auth_connected', 'true');
            } else if (event === 'SIGNED_OUT') {
              localStorage.removeItem('auth_connected');
              localStorage.removeItem('user_data');
            } else if (event === 'TOKEN_REFRESHED') {
              setLastActivity(Date.now());
            }
          }
        );
        
        authSubscription = subscription;
        
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          throw error;
        }
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          setLastActivity(Date.now());
          localStorage.setItem('auth_connected', 'true');
        }
        
      } catch (error) {
        console.error("Error initializing authentication:", error);
        toast.error("Erreur d'initialisation de l'authentification");
      } finally {
        setIsLoading(false);
      }
    };

    const handleSignOut = async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Error signing out:", error);
      }
    };

    // Set up activity monitoring
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Set up session check timer
    activityTimer = setInterval(checkSessionValidity, 60000); // Check every minute

    initAuth();

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (activityTimer) {
        clearInterval(activityTimer);
      }
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [session, lastActivity]);

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setLastActivity(Date.now());
    } catch (error) {
      console.error("Error refreshing session:", error);
      toast.error("Erreur lors du rafraîchissement de la session");
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    lastActivity,
    refreshSession
  };
}
