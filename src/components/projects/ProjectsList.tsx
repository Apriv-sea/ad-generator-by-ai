// Liste des projets avec actions rapides
// Interface optimisée pour la gestion des projets

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, Eye, Download, Copy, Trash2, 
  MoreHorizontal, Play, Pause, Wand2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface ProjectsListProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, onProjectSelect }) => {
  
  const getStatusConfig = (status: Project['status']) => {
    const configs = {
      draft: { 
        variant: "outline" as const, 
        text: "Brouillon", 
        color: "text-gray-600",
        bgColor: "bg-gray-50"
      },
      importing: { 
        variant: "secondary" as const, 
        text: "Import...", 
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      ready: { 
        variant: "default" as const, 
        text: "Prêt", 
        color: "text-green-600",
        bgColor: "bg-green-50"
      },
      generating: { 
        variant: "secondary" as const, 
        text: "Génération...", 
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      },
      completed: { 
        variant: "secondary" as const, 
        text: "Terminé", 
        color: "text-green-700",
        bgColor: "bg-green-100"
      }
    };
    
    return configs[status] || configs.draft;
  };

  const getActionButtons = (project: Project) => {
    const buttons = [];
    
    switch (project.status) {
      case 'draft':
        buttons.push({
          icon: Play,
          label: "Continuer",
          variant: "default" as const,
          action: () => console.log('Continue project', project.id)
        });
        break;
        
      case 'ready':
        buttons.push({
          icon: Wand2,
          label: "Générer",
          variant: "default" as const,
          action: () => console.log('Generate content', project.id)
        });
        break;
        
      case 'completed':
        buttons.push({
          icon: Eye,
          label: "Voir",
          variant: "outline" as const,
          action: () => onProjectSelect(project)
        });
        buttons.push({
          icon: Download,
          label: "Export",
          variant: "outline" as const,
          action: () => console.log('Export project', project.id)
        });
        break;
        
      case 'generating':
        buttons.push({
          icon: Pause,
          label: "Pause",
          variant: "outline" as const,
          action: () => console.log('Pause generation', project.id)
        });
        break;
    }
    
    return buttons;
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun projet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Commencez par créer votre premier projet de génération de contenu
          </p>
          <Button>
            Créer un projet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mes Projets</h2>
          <p className="text-muted-foreground">
            {projects.length} projet{projects.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            Filtrer
          </Button>
          <Button variant="outline">
            Trier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const statusConfig = getStatusConfig(project.status);
          const actionButtons = getActionButtons(project);
          
          return (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                    <CardDescription>{project.client}</CardDescription>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.text}
                  </Badge>
                  
                  {project.estimatedCost && project.estimatedCost > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {project.estimatedCost.toFixed(2)}€
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Métriques du projet */}
                {project.status === 'completed' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Titres</p>
                      <p className="font-medium">{project.titlesCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Descriptions</p>
                      <p className="font-medium">{project.descriptionsCount}</p>
                    </div>
                  </div>
                )}
                
                {/* Dernière modification */}
                <p className="text-xs text-muted-foreground">
                  Modifié {project.lastModified}
                </p>
                
                {/* Actions */}
                <div className="flex space-x-2">
                  {actionButtons.map((button, index) => {
                    const IconComponent = button.icon;
                    return (
                      <Button
                        key={index}
                        size="sm"
                        variant={button.variant}
                        onClick={(e) => {
                          e.stopPropagation();
                          button.action();
                        }}
                        className="flex-1"
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {button.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsList;