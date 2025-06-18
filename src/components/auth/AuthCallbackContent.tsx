
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthDebugDialog from "@/components/AuthDebugDialog";
import AuthError from "@/components/auth/AuthError";
import AuthLoading from "@/components/auth/AuthLoading";

interface AuthCallbackContentProps {
  status: { type: string; message: string };
  errorDetails: string | null;
  isTokenFound: boolean;
  manualRedirectToRoot: () => void;
  isProcessing: boolean;
}

const AuthCallbackContent: React.FC<AuthCallbackContentProps> = ({
  status,
  errorDetails,
  isTokenFound,
  manualRedirectToRoot,
  isProcessing,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-lg p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{status.message}</h1>
        
        {errorDetails && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left mb-4">
            <p className="text-red-800 font-medium mb-2">Détails de l'erreur:</p>
            <p className="text-red-700 text-sm whitespace-pre-wrap">{errorDetails}</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="mt-4 animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        )}
        
        <div className="mt-6 space-y-2">
          <Button variant="outline" onClick={() => navigate("/auth")} className="mx-1">
            Retour à la page de connexion
          </Button>
          
          {isTokenFound && (
            <Button onClick={manualRedirectToRoot} className="mx-1">
              Rediriger vers la page d'accueil
            </Button>
          )}
          
          <div className="mt-4">
            <AuthDebugDialog trigger={
              <Button variant="link" size="sm">
                Afficher les informations de débogage
              </Button>
            } />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackContent;
