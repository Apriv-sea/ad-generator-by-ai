
import React, { createContext, useContext, ReactNode } from "react";
import { User, Session } from '@supabase/supabase-js';
import { useAuthSession } from "@/hooks/useAuthSession";
import { useAuthActions } from "@/hooks/useAuthActions";
import { processAuthTokens } from "@/utils/authUtils";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  emailLogin: (email?: string) => Promise<void>;
  processAuthTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use our custom hooks to manage auth state and actions
  const { user, session, isLoading, isAuthenticated } = useAuthSession();
  const { login, signup, logout, emailLogin } = useAuthActions();

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        session,
        isLoading,
        login,
        signup,
        logout,
        emailLogin,
        isAuthenticated,
        processAuthTokens
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
