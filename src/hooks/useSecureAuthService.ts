/**
 * Secure Authentication Hook using Enhanced Auth Service
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { EnhancedAuthService } from '@/services/security/enhancedAuthService';
import { toast } from 'sonner';

interface SecureAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginAttempts: number;
}

export function useSecureAuthService() {
  const [authState, setAuthState] = useState<SecureAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    loginAttempts: 0
  });

  // Initialize authentication
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        if (isMounted) {
          setAuthState({
            session,
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
            loginAttempts: 0
          });
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('🔐 Secure auth state changed:', event);
            
            if (isMounted) {
              setAuthState(prev => ({
                ...prev,
                session,
                user: session?.user || null,
                isAuthenticated: !!session?.user,
                isLoading: false
              }));
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (isMounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup?.then(unsub => unsub?.());
    };
  }, []);

  // Secure login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const userAgent = navigator.userAgent;
      await EnhancedAuthService.secureLogin(email, password, userAgent);
      
      setAuthState(prev => ({ ...prev, loginAttempts: 0 }));
      toast.success('Connexion réussie');
    } catch (error: any) {
      console.error('Secure login error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loginAttempts: prev.loginAttempts + 1 
      }));
      
      const message = error.message || 'Erreur de connexion';
      toast.error(message);
      throw error;
    }
  }, []);

  // Secure signup
  const signup = useCallback(async (email: string, password: string) => {
    try {
      const userAgent = navigator.userAgent;
      await EnhancedAuthService.secureSignup(email, password, userAgent);
      
      toast.success('Inscription réussie ! Vérifiez vos emails pour confirmer votre compte.');
    } catch (error: any) {
      console.error('Secure signup error:', error);
      const message = error.message || "Erreur d'inscription";
      toast.error(message);
      throw error;
    }
  }, []);

  // Secure logout
  const signOut = useCallback(async () => {
    try {
      await EnhancedAuthService.secureLogout();
      
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        loginAttempts: 0
      });
      
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      console.error('Secure sign out error:', error);
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  }, []);

  return {
    ...authState,
    login,
    signup,
    signOut
  };
}