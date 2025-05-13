
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailAuthWarningProps {
  onContinue?: () => void;
}

const EmailAuthWarning: React.FC<EmailAuthWarningProps> = ({ onContinue }) => {
  return (
    <Alert className="bg-white border border-amber-200 mb-4">
      <AlertTitle className="text-amber-700 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>
        Application non vérifiée
      </AlertTitle>
      <AlertDescription className="text-sm">
        <p className="mb-2">
          Pendant le développement, le service d'authentification peut afficher un avertissement car l'application n'a pas encore été vérifiée.
        </p>
        <p className="mb-2">
          Pour continuer, suivez les instructions à l'écran pour revenir à l'application.
        </p>

        {onContinue && (
          <div className="flex justify-between items-center mt-2">
            <Button size="sm" onClick={onContinue}>
              Réessayer la connexion
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default EmailAuthWarning;
