
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Settings, FileSpreadsheet, Crown } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, isAdmin } = useUserProfile();
  
  const quickActions = [
    {
      icon: FileSpreadsheet,
      title: "Paramètres API",
      description: "Configurez vos clés API pour les différents LLMs",
      action: () => navigate("/settings"),
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: Users,
      title: "Mes clients",
      description: "Gérez vos clients et leurs informations",
      action: () => navigate("/clients"),
      color: "from-green-600 to-green-700"
    },
    {
      icon: Zap,
      title: "Génération de contenu", 
      description: "Créez et gérez vos campagnes publicitaires",
      action: () => navigate("/campaigns"),
      color: "from-purple-600 to-purple-700"
    }
  ];

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                Tableau de bord
                {isAdmin() && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
              </h1>
              <p className="text-gray-600">
                Bonjour {profile?.full_name || 'utilisateur'} ! Gérez vos campagnes publicitaires avec l'IA.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card 
                key={index} 
                className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group" 
                onClick={action.action}
              >
                <div className={`bg-gradient-to-br ${action.color} p-4`}>
                  <div className="flex items-center text-white">
                    <IconComponent className="w-6 h-6 mr-3" />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-slate-600 text-sm group-hover:text-slate-800 transition-colors">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Activité récente</h2>
          <Card>
            <CardHeader>
              <CardTitle>Commencer</CardTitle>
              <CardDescription>
                Vous n'avez pas encore d'activité. Commencez par configurer vos paramètres API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Configurer les paramètres
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
