
import React, { createContext, useContext, ReactNode } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  lastActivity: number;
  retryCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    session,
    isLoading,
    isAuthenticated,
    refreshSession,
    secureSignOut,
    lastActivity,
    retryCount
  } = useSecureAuth();

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    logout: secureSignOut,
    refreshSession,
    lastActivity,
    retryCount
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
