
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthDebugDialog from '@/components/AuthDebugDialog';
import { ArrowRight, FileSpreadsheet, Wand2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeroSectionProps {
  authError: string | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ authError }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
        Générateur de contenu publicitaire avec IA
      </h1>
      
      <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
        Créez des annonces Google Ads performantes grâce à l'intelligence artificielle
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
                    <CardTitle className="text-lg text-white">{action.title}</CardTitle>
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
  );
};

export default HeroSection;
