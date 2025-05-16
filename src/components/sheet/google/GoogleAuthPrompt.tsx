
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Globe } from "lucide-react";

interface GoogleAuthPromptProps {
  authError: string | null;
  isAuthenticating: boolean;
  onGoogleAuth: () => void;
}

const GoogleAuthPrompt: React.FC<GoogleAuthPromptProps> = ({ 
  authError, 
  isAuthenticating, 
  onGoogleAuth 
}) => {
  return (
    <div className="flex flex-col items-center py-8">
      <FileSpreadsheet className="h-12 w-12 mb-4 text-primary/50" />
      <h3 className="text-lg font-medium mb-2">Connectez-vous à Google Sheets</h3>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Connectez votre compte Google pour créer et gérer vos feuilles directement depuis notre application
      </p>
      
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur d'authentification</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4 w-full max-w-md">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTitle className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Configuration requise
          </AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>Avant de vous connecter, assurez-vous que ces URLs sont correctement configurées dans votre console Google Cloud:</p>
            
            <div className="mt-2">
              <p className="font-medium">URI JavaScript autorisée:</p>
              <code className="bg-white p-1 block text-xs rounded border mt-1 mb-2 break-all">{window.location.origin}</code>
            </div>
            
            <div>
              <p className="font-medium">URI de redirection autorisée:</p>
              <code className="bg-white p-1 block text-xs rounded border mt-1 break-all">{window.location.origin}/auth/callback/google</code>
            </div>
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={onGoogleAuth} 
          disabled={isAuthenticating}
          className="w-full gap-2"
        >
          <Globe className="h-4 w-4" />
          {isAuthenticating ? "Connexion en cours..." : "Se connecter à Google Sheets"}
        </Button>
      </div>
    </div>
  );
};

// Import this at the top
import { FileSpreadsheet } from "lucide-react";

export default GoogleAuthPrompt;
