
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SignupFormProps {
  setActiveTab: (tab: string) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ setActiveTab }) => {
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [processingAuth, setProcessingAuth] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    try {
      setProcessingAuth(true);
      await signup(email, password);
      setActiveTab("login");
      toast.success("Compte créé avec succès! Veuillez vérifier votre email.");
    } catch (error) {
      console.error("Erreur d'inscription:", error);
    } finally {
      setProcessingAuth(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password">Mot de passe</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Le mot de passe doit contenir au moins 6 caractères
        </p>
      </div>
      
      <Button type="submit" className="w-full" disabled={processingAuth}>
        S'inscrire
      </Button>
    </form>
  );
};

export default SignupForm;
