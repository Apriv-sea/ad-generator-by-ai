
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Mail } from "lucide-react";

const EmailLoginButton = () => {
  const { emailLogin } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(false);
  const [email, setEmail] = useState("");

  const handleEmailLogin = async () => {
    try {
      setProcessingAuth(true);
      await emailLogin(email);
    } catch (error) {
      console.error("Erreur de connexion par email:", error);
    } finally {
      setProcessingAuth(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full flex gap-2 items-center justify-center" 
      onClick={handleEmailLogin} 
      disabled={processingAuth}
    >
      <Mail className="h-4 w-4" />
      {processingAuth ? "Envoi en cours..." : "Connexion par lien magique"}
    </Button>
  );
};

export default EmailLoginButton;
