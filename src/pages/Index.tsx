
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthDebugDialog from "@/components/AuthDebugDialog";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, processAuthTokens } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState<boolean>(false);

  // Vérifier si l'URL contient des tokens d'authentification
  useEffect(() => {
    // Vérifier si nous sommes sur localhost et avons des tokens
    if (window.location.hostname === 'localhost' && 
        window.location.hash && 
        window.location.hash.includes('access_token')) {
      console.log("Détection de jetons d'authentification sur localhost, redirection...");
      navigate('/localhost-redirect');
      return;
    }
    
    // Traiter les jetons d'authentification s'ils sont présents dans l'URL
    const handleTokensInRoot = async () => {
      // Vérifier si l'URL contient des jetons d'authentification
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log("Jetons d'authentification détectés dans la page d'accueil");
        setProcessingAuth(true);
        
        try {
          const tokenProcessed = await processAuthTokens();
          
          if (tokenProcessed) {
            toast.success("Authentification réussie!");
            // Nettoyer l'URL après traitement du jeton
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Si l'authentification a réussi, rediriger vers le tableau de bord
            setTimeout(() => {
              if (isAuthenticated) {
                navigate("/dashboard");
              }
            }, 1000);
          } else {
            console.error("Échec du traitement du jeton");
            setAuthError("Échec du traitement du jeton d'authentification.");
          }
        } catch (error) {
          console.error("Erreur lors du traitement des jetons:", error);
          setAuthError(`Erreur d'authentification: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setProcessingAuth(false);
        }
      } else if (location.search && location.search.includes('error')) {
        // Extract error from query params
        const params = new URLSearchParams(location.search);
        const error = params.get('error');
        const errorDesc = params.get('error_description');
        console.error(`Erreur OAuth: ${error}: ${errorDesc}`);
        setAuthError(`Erreur Google OAuth: ${error}. ${errorDesc || ''}`);
      }
    };

    handleTokensInRoot();
  }, [isAuthenticated, navigate, processAuthTokens]);

  // Si l'utilisateur est déjà authentifié, rediriger vers le tableau de bord
  useEffect(() => {
    if (isAuthenticated && !processingAuth) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, processingAuth]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Ad Content Generator</h1>
        <p className="text-xl text-center mb-10">
          Générez des titres et descriptions publicitaires efficaces en intégrant Google Sheets et l'IA
        </p>
        
        {authError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="whitespace-pre-wrap">
              {authError}
              <div className="mt-2">
                <AuthDebugDialog
                  trigger={<Button variant="outline" size="sm">Afficher les informations de débogage</Button>}
                />
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-slate-50 p-6 rounded-lg mb-10 shadow-sm">
          <p className="mb-4 text-center">
            Cet outil a été imaginé par Antoine, consultant senior SEA de l'agence RESONEO, pour simplifier et optimiser la création de contenu publicitaire.
          </p>
          <p className="mb-4">
            L'Ad Content Generator vous permet de générer automatiquement des titres et descriptions publicitaires optimisés pour vos campagnes SEA, en se basant sur les informations de vos clients et les mots-clés pertinents.
          </p>
          <p className="mb-4">
            <strong>Un point fort majeur :</strong> Vous avez la liberté d'utiliser le modèle de langage (LLM) de votre choix (OpenAI, Anthropic, Google Gemini). Pour cela, vous devrez vous munir au préalable des clés API correspondantes que vous pourrez configurer dans les paramètres. Cette flexibilité vous permet de générer des annonces ultra-pertinentes pour votre compte Google Ads selon vos préférences et besoins spécifiques.
          </p>
          <p>
            <strong>Pourquoi nous demandons l'accès à votre compte Google :</strong> L'outil s'intègre directement avec Google Drive et Google Sheets pour récupérer vos données client et y écrire les annonces générées. Toutes les opérations sont transparentes et ne concernent que les documents que vous autorisez explicitement.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Commencez</CardTitle>
              <CardDescription>Connectez-vous avec votre compte Google</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Authentifiez-vous pour accéder à Google Drive et Sheets
              </p>
              <Button 
                className="w-full" 
                onClick={() => navigate("/auth")}
              >
                Connexion
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Comment ça marche</CardTitle>
              <CardDescription>Découvrez notre processus</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Intégration simple avec vos outils existants et génération de contenu par IA
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/how-it-works")}
              >
                En savoir plus
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <Link to="/privacy-policy" className="hover:underline">
          Règles de confidentialité
        </Link>
      </div>
    </div>
  );
};

export default Index;
