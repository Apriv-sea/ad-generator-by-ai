import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  processAuthTokens: () => Promise<boolean>;
}

type UseAuthReturn = AuthState & AuthActions;

/**
 * Hook d'authentification unifié et optimisé
 * Remplace useSimpleAuth, useAuthSession et useSecureAuth
 */
export function useUnifiedAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false
  });

  const mountedRef = useRef(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Optimized auth state updater
  const updateAuthState = useCallback((session: Session | null) => {
    if (!mountedRef.current) return;
    
    setAuthState(prev => ({
      ...prev,
      session,
      user: session?.user || null,
      isAuthenticated: !!session?.user,
      isLoading: false
    }));
  }, []);

  // Initialize authentication
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        if (isMounted) {
          updateAuthState(session);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            if (isMounted) {
              updateAuthState(session);
              
              // Handle specific events
              if (event === 'SIGNED_OUT') {
                // Clear any cached data
                localStorage.removeItem('auth_connected');
                localStorage.removeItem('user_data');
              }
            }
          }
        );

        subscriptionRef.current = subscription;

      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (isMounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [updateAuthState]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Connexion réussie');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.message || 'Erreur de connexion';
      toast.error(message);
      throw error;
    }
  }, []);

  // Signup function  
  const signup = useCallback(async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Inscription réussie ! Vérifiez vos emails.');
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error.message || "Erreur d'inscription";
      toast.error(message);
      throw error;
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  }, []);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      updateAuthState(session);
    } catch (error) {
      console.error('Session refresh error:', error);
      // Don't show toast for refresh errors as they're usually silent
    }
  }, [updateAuthState]);

  // Process auth tokens (for backward compatibility)
  const processAuthTokens = useCallback(async (): Promise<boolean> => {
    try {
      const hasTokens = window.location.hash?.includes('access_token');
      if (hasTokens) {
        // Token processing will be handled by auth state change listener
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error processing auth tokens:', error);
      return false;
    }
  }, []);

  return {
    ...authState,
    login,
    signup,
    signOut,
    refreshSession,
    processAuthTokens
  };
}