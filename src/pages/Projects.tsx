// Page Projets unifiée - Remplace Dashboard + Campaigns
// Workflow simplifié en 3 étapes : Setup → Import → Generate

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  FileSpreadsheet, Plus, Clock, TrendingUp, Wand2, 
  Users, Settings as SettingsIcon, ChevronRight, 
  Play, Eye, FileText, Download 
} from "lucide-react";

// Composants du workflow simplifié
import ProjectWorkflow from "@/components/projects/ProjectWorkflow";
import ProjectsList from "@/components/projects/ProjectsList";
import QuickStats from "@/components/projects/QuickStats";

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'draft' | 'importing' | 'ready' | 'generating' | 'completed';
  lastModified: string;
  titlesCount: number;
  descriptionsCount: number;
  estimatedCost?: number;
}

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Projets simulés (sera remplacé par vraies données)
  const [projects] = useState<Project[]>([
    {
      id: "1",
      name: "Campagne Chaussures Sport",
      client: "SportMax",
      status: "completed",
      lastModified: "Il y a 2 heures",
      titlesCount: 45,
      descriptionsCount: 12,
      estimatedCost: 2.50
    },
    {
      id: "2", 
      name: "Promo Été 2024",
      client: "FashionHub",
      status: "ready",
      lastModified: "Hier",
      titlesCount: 0,
      descriptionsCount: 0,
      estimatedCost: 4.20
    }
  ]);

  const quickActions = [
    {
      icon: Plus,
      title: "Nouveau Projet",
      description: "Créer un nouveau projet de génération",
      action: () => setActiveTab("workflow"),
      color: "from-blue-600 to-blue-700",
      primary: true
    },
    {
      icon: Users,
      title: "Gérer les Clients",
      description: "Ajouter ou modifier vos clients",
      action: () => navigate("/clients"),
      color: "from-purple-600 to-purple-700"
    },
    {
      icon: SettingsIcon,
      title: "Configuration",
      description: "Clés API et paramètres",
      action: () => navigate("/settings"),
      color: "from-gray-600 to-gray-700"
    }
  ];

  const getStatusBadge = (status: Project['status']) => {
    const variants = {
      draft: { variant: "outline" as const, text: "Brouillon" },
      importing: { variant: "secondary" as const, text: "Import..." },
      ready: { variant: "default" as const, text: "Prêt" },
      generating: { variant: "secondary" as const, text: "Génération..." },
      completed: { variant: "secondary" as const, text: "Terminé" }
    };
    
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header simplifié */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Projets</h1>
            <p className="text-muted-foreground">
              Bienvenue {user?.email?.split('@')[0]}, créez et gérez vos campagnes publicitaires
            </p>
          </div>
          
          <Button 
            onClick={() => setActiveTab("workflow")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Projet
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <QuickStats projects={projects} />

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="workflow">Nouveau Projet</TabsTrigger>
          <TabsTrigger value="projects">Mes Projets</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Card 
                  key={index} 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${action.primary ? 'ring-2 ring-blue-200' : ''}`}
                  onClick={action.action}
                >
                  <div className={`bg-gradient-to-br ${action.color} p-4`}>
                    <div className="flex items-center text-white">
                      <IconComponent className="w-6 h-6 mr-3" />
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">{action.description}</p>
                    {action.primary && (
                      <div className="flex items-center mt-3 text-blue-600 text-sm font-medium">
                        Commencer <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Projets récents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projets Récents</CardTitle>
                  <CardDescription>
                    Vos derniers projets de génération
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setActiveTab("projects")}>
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.client} • {project.lastModified}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(project.status)}
                      
                      {project.status === 'completed' && (
                        <div className="text-sm text-muted-foreground">
                          {project.titlesCount} titres, {project.descriptionsCount} desc.
                        </div>
                      )}
                      
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guide de démarrage simplifié */}
          <Card>
            <CardHeader>
              <CardTitle>Démarrage Rapide</CardTitle>
              <CardDescription>
                3 étapes simples pour générer vos premières annonces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">1</div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <p className="text-sm text-muted-foreground">Client + Clés API</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">2</div>
                  <h4 className="font-medium mb-2">Import</h4>
                  <p className="text-sm text-muted-foreground">Google Sheets</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">3</div>
                  <h4 className="font-medium mb-2">Génération</h4>
                  <p className="text-sm text-muted-foreground">Preview + IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow simplifié */}
        <TabsContent value="workflow">
          <ProjectWorkflow 
            onProjectCreated={(project) => {
              console.log('Nouveau projet créé:', project);
              setActiveTab("projects");
            }}
          />
        </TabsContent>

        {/* Liste des projets */}
        <TabsContent value="projects">
          <ProjectsList 
            projects={projects}
            onProjectSelect={setSelectedProject}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;