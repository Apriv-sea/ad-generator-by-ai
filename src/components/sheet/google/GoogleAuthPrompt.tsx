
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Globe, FileSpreadsheet, Shield, CheckCircle } from "lucide-react";
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface GoogleAuthPromptProps {
  authError?: string | null;
  isAuthenticating?: boolean;
  onGoogleAuth?: () => void;
}

const GoogleAuthPrompt: React.FC<GoogleAuthPromptProps> = ({ 
  authError, 
  isAuthenticating: externalAuthenticating, 
  onGoogleAuth 
}) => {
  const { isAuthenticated, isLoading, userInfo, error, signIn, signOut } = useGoogleAuth();
  
  const isAuthenticatingState = externalAuthenticating || isLoading;
  const displayError = authError || error;

  if (isAuthenticated && userInfo) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <CheckCircle className="h-5 w-5 mr-2" />
            Connecté à Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-green-700">
            <p><strong>Compte :</strong> {userInfo.email}</p>
            <p><strong>Permissions :</strong> Lecture et écriture des feuilles de calcul</p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-green-600">
            <Shield className="h-3 w-3" />
            <span>Connexion sécurisée avec refresh automatique</span>
          </div>
          
          <Button onClick={signOut} variant="outline" size="sm">
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
          Connexion Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <FileSpreadsheet className="h-12 w-12 mb-4 text-primary/50 mx-auto" />
          <h3 className="text-lg font-medium mb-2">Accès sécurisé à vos feuilles</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connectez votre compte Google pour créer et gérer vos feuilles de calcul directement 
            depuis notre application avec une authentification sécurisée.
          </p>
        </div>
        
        {displayError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur d'authentification</AlertTitle>
            <AlertDescription className="text-sm">{displayError}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-blue-900 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité et Confidentialité
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Authentification OAuth2 sécurisée</li>
            <li>• Tokens chiffrés et auto-renouvelés</li>
            <li>• Accès uniquement aux feuilles de calcul</li>
            <li>• Révocation possible à tout moment</li>
          </ul>
        </div>
        
        <Button 
          onClick={onGoogleAuth || signIn}
          disabled={isAuthenticatingState}
          className="w-full gap-2"
          size="lg"
        >
          <Globe className="h-4 w-4" />
          {isAuthenticatingState ? "Connexion en cours..." : "Se connecter à Google Sheets"}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          En vous connectant, vous acceptez que notre application accède à vos feuilles Google Sheets 
          pour vous permettre de les gérer efficacement.
        </p>
      </CardContent>
    </Card>
  );
};

export default GoogleAuthPrompt;
