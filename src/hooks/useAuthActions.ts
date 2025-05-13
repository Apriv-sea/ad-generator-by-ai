
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAuthActions() {
  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connection successful");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login error");
      throw error;
    }
  };

  // Signup function with captcha support
  const signup = async (email: string, password: string, captchaToken?: string) => {
    try {
      const signupOptions: any = {
        email,
        password,
      };
      
      // Ajouter le token captcha si fourni
      if (captchaToken) {
        signupOptions.options = {
          captchaToken
        };
      }
      
      const { error } = await supabase.auth.signUp(signupOptions);
      if (error) throw error;
      toast.success("Registration successful. Please check your email to confirm your account.");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration error");
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clean localStorage
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_connected');
      toast.success("Logout successful");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  return {
    login,
    signup,
    logout
  };
}
