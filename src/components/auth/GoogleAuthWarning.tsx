
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface EmailAuthWarningProps {
  onContinue: () => void;
}

const EmailAuthWarning: React.FC<EmailAuthWarningProps> = ({ onContinue }) => {
  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTitle className="text-amber-800 flex items-center gap-2">
        <span className="i-lucide-alert-circle h-4 w-4"></span>
        Problème d'authentification
      </AlertTitle>
      
      <AlertDescription className="space-y-4 text-amber-700">
        <p>
          Nous avons rencontré un problème lors de votre authentification. Cela peut être dû à:
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Une adresse email non vérifiée</li>
          <li>Une session expirée ou invalide</li>
          <li>Un refus d'autorisation de votre part</li>
        </ul>
        <div className="pt-2">
          <Button
            onClick={onContinue}
            variant="outline"
            size="sm"
            className="bg-amber-100 border-amber-200 text-amber-900 hover:bg-amber-200 hover:text-amber-950"
          >
            Réessayer avec une autre méthode
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EmailAuthWarning;
