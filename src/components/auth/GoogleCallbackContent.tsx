
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DebugOAuthConfig from "@/components/debug/DebugOAuthConfig";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GoogleCallbackContentProps {
  status: "processing" | "success" | "error";
  errorDetails: string | null;
  goBack: () => void;
}

const GoogleCallbackContent: React.FC<GoogleCallbackContentProps> = ({
  status,
  errorDetails,
  goBack,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="shadow-lg rounded-lg max-w-lg w-full">
        <CardContent className="p-6">
          <div className="text-center">
            {status === "processing" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-2xl font-semibold mb-2">Traitement de l'authentification Google...</h2>
                <p className="text-muted-foreground">Veuillez patienter pendant que nous finalisons votre connexion.</p>
              </>
            )}
            
            {status === "success" && (
              <>
                <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-green-600">Authentification Google réussie!</h2>
                <p className="text-muted-foreground">Vous êtes maintenant connecté. Redirection en cours...</p>
              </>
            )}
            
            {status === "error" && (
              <>
                <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-red-600">Échec de l'authentification Google</h2>
                
                {errorDetails && (
                  <Alert variant="destructive" className="mt-4 mb-4 text-left">
                    <AlertTitle>Détails de l'erreur:</AlertTitle>
                    <AlertDescription>
                      <pre className="whitespace-pre-wrap text-sm mt-1">{errorDetails}</pre>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-6">
                  <Button 
                    className="mb-4"
                    onClick={goBack}
                  >
                    Retourner à l'application
                  </Button>
                </div>
                
                {/* Informations de configuration pour l'authentification Google */}
                <div className="mt-6 border-t pt-4 text-left">
                  <h3 className="font-semibold mb-2">Configuration Google OAuth</h3>
                  
                  <Alert className="mb-4 bg-white border-slate-200">
                    <AlertTitle>Assurez-vous d'ajouter les URI suivantes dans votre console Google Cloud:</AlertTitle>
                    <AlertDescription>
                      <p className="mt-2"><strong>URI JavaScript autorisée:</strong></p>
                      <code className="bg-white p-1 block rounded border mt-1 mb-3">{window.location.origin}</code>
                      
                      <p><strong>URI de redirection autorisée:</strong></p>
                      <code className="bg-white p-1 block rounded border mt-1">{window.location.origin}/auth/callback/google</code>
                    </AlertDescription>
                  </Alert>
                  
                  <DebugOAuthConfig />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallbackContent;
