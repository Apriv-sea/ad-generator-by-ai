
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const EmailLoginButton = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      // This is just a placeholder until we implement proper email login
      console.log("Email login button clicked");
      // In the future, we could implement a modal or redirect to a form
    } catch (error) {
      console.error("Error initiating email login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full flex gap-2 items-center justify-center" 
      onClick={handleClick}
      disabled={isLoading}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
      Continuer avec l'authentification par email
    </Button>
  );
};

export default EmailLoginButton;
