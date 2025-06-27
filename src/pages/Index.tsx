import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthDebugDialog from "@/components/AuthDebugDialog";
import { Zap, Brain, Users, Shield, ArrowRight, FileSpreadsheet, Wand2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, processAuthTokens } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState<boolean>(false);
  const [tokenProcessed, setTokenProcessed] = useState<boolean>(false);

  // Check for authentication tokens in URL only once
  useEffect(() => {
    let isMounted = true;

    const handleAuthTokens = async () => {
      // Prevent multiple processing attempts
      if (tokenProcessed) return;

      // Check if we're on localhost and have tokens
      const hasHashToken = window.location.hash && window.location.hash.includes('access_token');
      const isLocalhost = window.location.hostname === 'localhost';
      
      if (isLocalhost && hasHashToken) {
        console.log("Détection de jetons d'authentification sur localhost, redirection...");
        navigate('/localhost-redirect');
        return;
      }

      // Process authentication tokens if present
      if (hasHashToken && !tokenProcessed) {
        console.log("Jetons d'authentification détectés dans la page d'accueil");
        setProcessingAuth(true);
        setTokenProcessed(true);
        
        try {
          const processed = await processAuthTokens();
          if (processed && isMounted) {
            toast.success("Authentification réussie!");
            // Clean URL after processing
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setTimeout(() => {
              if (isAuthenticated) {
                navigate("/dashboard");
              }
            }, 1000);
          } else if (isMounted) {
            console.error("Échec du traitement du jeton");
            setAuthError("Échec du traitement du jeton d'authentification.");
          }
        } catch (error) {
          if (isMounted) {
            console.error("Erreur lors du traitement des jetons:", error);
            setAuthError(`Erreur d'authentification: ${error instanceof Error ? error.message : String(error)}`);
          }
        } finally {
          if (isMounted) {
            setProcessingAuth(false);
          }
        }
      } else if (location.search && location.search.includes('error') && !tokenProcessed) {
        // Extract error from query params
        const params = new URLSearchParams(location.search);
        const error = params.get('error');
        const errorDesc = params.get('error_description');
        console.error(`Erreur OAuth: ${error}: ${errorDesc}`);
        if (isMounted) {
          setAuthError(`Erreur d'authentification: ${error}. ${errorDesc || ''}`);
        }
      }
    };

    handleAuthTokens();

    return () => {
      isMounted = false;
    };
  }, []); // Remove dependencies to prevent re-processing

  // Redirect authenticated users only once
  useEffect(() => {
    if (isAuthenticated && !processingAuth && !tokenProcessed) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, processingAuth, navigate, tokenProcessed]);

  const features = [
    {
      icon: Brain,
      title: "IA Multi-Modèles",
      description: "OpenAI, Anthropic, Claude selon vos besoins"
    },
    {
      icon: Zap,
      title: "Génération Rapide",
      description: "Créez des centaines d'annonces en quelques minutes"
    },
    {
      icon: Shield,
      title: "Données Sécurisées",
      description: "Traitement local, vos données restent privées"
    }
  ];

  const quickActions = [
    {
      icon: FileSpreadsheet,
      title: "Campagnes",
      description: "Gérez vos campagnes publicitaires",
      action: () => navigate("/campaigns"),
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: Wand2,
      title: "Génération IA",
      description: "Créez du contenu avec l'IA",
      action: () => navigate("/campaigns"),
      color: "from-green-600 to-green-700"
    },
    {
      icon: Users,
      title: "Clients",
      description: "Configurez vos clients",
      action: () => navigate("/clients"),
      color: "from-purple-600 to-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-slate-900">
              Ad Content Generator
            </Link>
            {!isAuthenticated && (
              <Button onClick={() => navigate("/auth")} variant="outline">
                Connexion
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Générateur de contenu publicitaire avec IA
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Créez des campagnes Google Ads performantes grâce à l'intelligence artificielle
            </p>

            {authError && (
              <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
                <AlertDescription className="whitespace-pre-wrap">
                  {authError}
                  <div className="mt-2">
                    <AuthDebugDialog trigger={<Button variant="outline" size="sm">Informations de débogage</Button>} />
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions principales */}
            {isAuthenticated ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={action.action}>
                      <div className={`bg-gradient-to-br ${action.color} p-4`}>
                        <div className="flex items-center text-white">
                          <IconComponent className="w-6 h-6 mr-3" />
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-slate-600 text-sm">{action.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")} 
                  className="px-8 py-3"
                >
                  Commencer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigate("/how-it-works")}
                  className="px-8 py-3"
                >
                  Comment ça marche
                </Button>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How it works - Simple */}
          {!isAuthenticated && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">
                Processus en 3 étapes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">1</div>
                  <h3 className="font-semibold mb-2">Configurez vos clients</h3>
                  <p className="text-sm text-slate-600">Ajoutez les informations de vos clients et leur contexte métier</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">2</div>
                  <h3 className="font-semibold mb-2">Créez vos campagnes</h3>
                  <p className="text-sm text-slate-600">Définissez vos groupes d'annonces et mots-clés principaux</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">3</div>
                  <h3 className="font-semibold mb-2">Générez avec l'IA</h3>
                  <p className="text-sm text-slate-600">L'IA crée automatiquement titres et descriptions optimisés</p>
                </div>
              </div>
              
              <Button size="lg" onClick={() => navigate("/auth")}>
                Commencer maintenant
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 text-center">
        <Link to="/privacy-policy" className="text-slate-500 hover:text-blue-600 transition-colors text-sm">
          Politique de confidentialité
        </Link>
      </footer>
    </div>
  );
};

export default Index;
