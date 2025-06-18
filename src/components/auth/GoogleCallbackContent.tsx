
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DebugOAuthConfig from "@/components/debug/DebugOAuthConfig";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GoogleCallbackContentProps {
  status: { type: "processing" | "success" | "error"; message: string };
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
      <Card className="shadow-lg rounded-lg max-w-2xl w-full">
        <CardContent className="p-6">
          <div className="text-center">
            {status.type === "processing" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-2xl font-semibold mb-2">{status.message}</h2>
                <p className="text-muted-foreground">Veuillez patienter pendant que nous finalisons votre connexion.</p>
              </>
            )}
            
            {status.type === "success" && (
              <>
                <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-green-600">{status.message}</h2>
                <p className="text-muted-foreground">Vous êtes maintenant connecté. Redirection en cours...</p>
              </>
            )}
            
            {status.type === "error" && (
              <>
                <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-red-600">{status.message}</h2>
                
                {errorDetails && (
                  <Alert variant="destructive" className="mt-4 mb-4 text-left">
                    <AlertTitle>Détails de l'erreur:</AlertTitle>
                    <AlertDescription>
                      <pre className="whitespace-pre-wrap text-sm mt-1">{errorDetails}</pre>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-6 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <h3 className="font-semibold text-blue-800 mb-3">Instructions pour résoudre le problème :</h3>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p><strong>1. Allez dans votre Console Google Cloud :</strong></p>
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      → Ouvrir la Console Google Cloud
                    </a>
                    
                    <p className="mt-3"><strong>2. Dans "URI de redirection autorisés", ajoutez exactement :</strong></p>
                    <code className="block bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                      {window.location.origin}/auth/callback/google
                    </code>
                    
                    <p className="mt-3"><strong>3. Dans "Origines JavaScript autorisées", ajoutez :</strong></p>
                    <code className="block bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                      {window.location.origin}
                    </code>
                    
                    <p className="mt-3 text-amber-700"><strong>⚠️ Important :</strong> Les URLs doivent être exactement identiques (http/https, avec/sans www)</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    className="mb-4"
                    onClick={goBack}
                  >
                    Retourner à l'application
                  </Button>
                </div>
                
                {/* Informations de débogage pour l'authentification Google */}
                <div className="mt-6 border-t pt-4 text-left">
                  <h3 className="font-semibold mb-2">Configuration Google OAuth</h3>
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
