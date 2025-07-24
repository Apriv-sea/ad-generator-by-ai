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
const HeroSection: React.FC<HeroSectionProps> = ({
  authError
}) => {
  const navigate = useNavigate();
  const {
    isAuthenticated
  } = useAuth();
  const quickActions = [{
    icon: FileSpreadsheet,
    title: "Annonces",
    description: "Générez vos annonces publicitaires",
    action: () => navigate("/campaigns"),
    color: "from-blue-600 to-blue-700"
  }, {
    icon: Wand2,
    title: "Génération IA",
    description: "Créez du contenu avec l'IA",
    action: () => navigate("/campaigns"),
    color: "from-green-600 to-green-700"
  }, {
    icon: Users,
    title: "Clients",
    description: "Configurez vos clients",
    action: () => navigate("/clients"),
    color: "from-purple-600 to-purple-700"
  }];
  return <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
        Générateur de contenu publicitaire avec IA
      </h1>
      
      <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
        Créez des annonces Google Ads performantes grâce à l'intelligence artificielle
      </p>

      {authError && <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
          <AlertDescription className="whitespace-pre-wrap">
            {authError}
            <div className="mt-2">
              <AuthDebugDialog trigger={<Button variant="outline" size="sm">Informations de débogage</Button>} />
            </div>
          </AlertDescription>
        </Alert>}

      {/* Actions principales */}
      {!isAuthenticated && <div className="space-y-6 mb-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="px-8 py-3 text-lg">
              Commencer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/how-it-works")} className="px-8 py-3 text-lg">
              Comment ça marche
            </Button>
          </div>
        </div>}
    </div>;
};
export default HeroSection;