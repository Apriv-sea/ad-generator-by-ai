
import React, { createContext, useContext, ReactNode } from "react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useAuthActions } from "@/hooks/useAuthActions";
import { processAuthTokens } from "@/utils/authUtils";
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  processAuthTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, session, isLoading, isAuthenticated, signOut } = useSimpleAuth();
  const { login, signup } = useAuthActions();

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout: signOut,
    processAuthTokens
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
