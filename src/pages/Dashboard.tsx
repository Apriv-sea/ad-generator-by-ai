
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileSpreadsheet, Users, Settings } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      icon: FileSpreadsheet,
      title: "Générer des Annonces",
      description: "Traiter un Google Sheet et générer du contenu",
      action: () => navigate("/projects"),
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

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header simplifié */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Tableau de bord
          </h1>
          <p className="text-lg text-muted-foreground">
            Bienvenue {user?.email?.split('@')[0] || 'utilisateur'}, générez du contenu publicitaire optimisé
          </p>
        </div>

        {/* Actions rapides centrées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105" 
                onClick={action.action}
              >
                <div className={`bg-gradient-to-br ${action.color} p-6`}>
                  <div className="flex items-center text-white">
                    <IconComponent className="w-8 h-8 mr-4" />
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
