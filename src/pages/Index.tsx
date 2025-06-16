import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthDebugDialog from "@/components/AuthDebugDialog";
import { Zap, Brain, Users, Shield, ArrowRight, Sparkles, Target } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    processAuthTokens
  } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState<boolean>(false);

  // Vérifier si l'URL contient des tokens d'authentification
  useEffect(() => {
    // Vérifier si nous sommes sur localhost et avons des tokens
    const checkLocalhostAuth = () => {
      const hasHashToken = window.location.hash && window.location.hash.includes('access_token');
      const isLocalhost = window.location.hostname === 'localhost';
      if (isLocalhost && hasHashToken) {
        console.log("Détection de jetons d'authentification sur localhost, redirection...");
        navigate('/localhost-redirect');
        return true;
      }
      return false;
    };

    // Si redirection vers localhost effectuée, on arrête le traitement
    if (checkLocalhostAuth()) {
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
        setAuthError(`Erreur d'authentification: ${error}. ${errorDesc || ''}`);
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
  const features = [{
    icon: Brain,
    title: "IA Multi-Modèles",
    description: "Choisissez entre OpenAI, Anthropic ou Claude selon vos besoins"
  }, {
    icon: Zap,
    title: "Génération Rapide",
    description: "Créez des centaines d'annonces en quelques minutes"
  }, {
    icon: Shield,
    title: "Données Sécurisées",
    description: "Traitement local, vos données restent confidentielles"
  }, {
    icon: Target,
    title: "Optimisation SEA",
    description: "Conçu pour maximiser vos performances publicitaires"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="container mx-auto px-4 pt-16 pb-20 py-[14px]">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Innovation IA pour le Marketing Digital
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent mb-6">
              Ad Content Generator
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-8 leading-relaxed">
              Révolutionnez vos campagnes publicitaires avec l'intelligence artificielle.<br />
              <span className="text-blue-600 font-semibold">Générez du contenu performant en quelques clics.</span>
            </p>

            {authError && <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
                <AlertDescription className="whitespace-pre-wrap">
                  {authError}
                  <div className="mt-2">
                    <AuthDebugDialog trigger={<Button variant="outline" size="sm">Informations de débogage</Button>} />
                  </div>
                </AlertDescription>
              </Alert>}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                Commencer maintenant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/how-it-works")} className="px-8 py-3 border-2 border-slate-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                Découvrir le processus
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Une solution complète et innovante
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Technologie de pointe au service de vos objectifs marketing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6">
              <CardTitle className="text-white text-xl mb-2">Prêt à commencer ?</CardTitle>
              <CardDescription className="text-blue-100">
                Connectez-vous et lancez votre première campagne en quelques minutes
              </CardDescription>
            </div>
            <CardContent className="p-6">
              <p className="text-slate-600 mb-6">
                Accédez à tous les outils de génération de contenu et configurez vos modèles IA préférés.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors" onClick={() => navigate("/auth")}>
                Se connecter
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6">
              <CardTitle className="text-white text-xl mb-2">Comment ça fonctionne ?</CardTitle>
              <CardDescription className="text-slate-300">
                Découvrez notre méthodologie et les étapes du processus
              </CardDescription>
            </div>
            <CardContent className="p-6">
              <p className="text-slate-600 mb-6">
                Intégration Google Sheets, génération IA intelligente et optimisation automatique.
              </p>
              <Button variant="outline" className="w-full border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 group-hover:bg-slate-50 transition-colors" onClick={() => navigate("/how-it-works")}>
                En savoir plus
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-slate-100/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Une approche moderne du marketing digital
            </h3>
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <p className="text-slate-700 mb-4 leading-relaxed">
                Cette solution révolutionne la création de contenu publicitaire en combinant 
                les dernières avancées en intelligence artificielle avec une interface intuitive 
                et des fonctionnalités avancées.
              </p>
              <p className="text-slate-700 mb-4 leading-relaxed">
                <strong>Flexibilité totale :</strong> Utilisez OpenAI, Anthropic, Claude ou d'autres modèles selon vos préférences. 
                Configurez vos clés API et personnalisez les prompts pour des résultats ultra-pertinents.
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>Confidentialité garantie :</strong> Toutes les données sont traitées localement dans votre navigateur. 
                Vos informations restent privées et sécurisées.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center border-t border-slate-200 bg-white">
        <Link to="/privacy-policy" className="text-slate-500 hover:text-blue-600 transition-colors text-sm">
          Politique de confidentialité
        </Link>
      </div>
    </div>;
};
export default Index;