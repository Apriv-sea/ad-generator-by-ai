
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileSpreadsheet, Users, Settings, Wand2, TrendingUp, Clock } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      icon: FileSpreadsheet,
      title: "Nouvelle Campagne",
      description: "Créez une campagne publicitaire",
      action: () => navigate("/campaigns"),
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: Users,
      title: "Gérer les Clients",
      description: "Ajoutez ou modifiez vos clients",
      action: () => navigate("/clients"),
      color: "from-purple-600 to-purple-700"
    },
    {
      icon: Settings,
      title: "Configuration",
      description: "Paramètres et clés API",
      action: () => navigate("/settings"),
      color: "from-gray-600 to-gray-700"
    }
  ];

  const stats = [
    {
      icon: TrendingUp,
      title: "Campagnes Actives",
      value: "0",
      description: "Campagnes en cours"
    },
    {
      icon: Wand2,
      title: "Contenus Générés",
      value: "0",
      description: "Annonces créées avec l'IA"
    },
    {
      icon: Clock,
      title: "Dernière Activité",
      value: "Aujourd'hui",
      description: "Connexion récente"
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Tableau de bord
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.email?.split('@')[0] || 'utilisateur'}, gérez vos campagnes publicitaires
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        {/* Guide de démarrage */}
        <Card>
          <CardHeader>
            <CardTitle>Guide de démarrage</CardTitle>
            <CardDescription>
              Suivez ces étapes pour créer votre première campagne
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium">Configurez vos clés API</h4>
                <p className="text-sm text-gray-600">Ajoutez vos clés OpenAI ou Anthropic dans les paramètres</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/settings")}>
                  Configurer
                </Button>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium">Ajoutez vos clients</h4>
                <p className="text-sm text-gray-600">Créez des profils clients avec leur contexte métier</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/clients")}>
                  Ajouter un client
                </Button>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium">Créez votre première campagne</h4>
                <p className="text-sm text-gray-600">Générez du contenu publicitaire optimisé</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/campaigns")}>
                  Nouvelle campagne
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default Dashboard;
