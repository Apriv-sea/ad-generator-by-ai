
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const EmailLoginButton = () => {
  const { emailLogin } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(false);

  const handleEmailLogin = async () => {
    try {
      setProcessingAuth(true);
      await emailLogin();
      // No need to navigate, the OAuth flow will redirect
    } catch (error) {
      console.error("Erreur de connexion par email:", error);
      setProcessingAuth(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={handleEmailLogin} 
      disabled={processingAuth}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
      Email
    </Button>
  );
};

export default EmailLoginButton;
