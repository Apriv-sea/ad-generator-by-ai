// Statistiques rapides pour la page Projets
// Métriques essentielles en un coup d'œil

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wand2, Clock, DollarSign } from "lucide-react";

interface Project {
  id: string;
  status: 'draft' | 'importing' | 'ready' | 'generating' | 'completed';
  titlesCount: number;
  descriptionsCount: number;
  estimatedCost?: number;
}

interface QuickStatsProps {
  projects: Project[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ projects }) => {
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalContent = projects.reduce((sum, p) => sum + p.titlesCount + p.descriptionsCount, 0);
  const totalCost = projects.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);
  const activeProjects = projects.filter(p => ['importing', 'generating'].includes(p.status)).length;

  const stats = [
    {
      icon: TrendingUp,
      title: "Projets Terminés",
      value: completedProjects.toString(),
      description: `${projects.length} total`,
      color: "text-green-600"
    },
    {
      icon: Wand2,
      title: "Contenus Générés",
      value: totalContent.toString(),
      description: "Titres et descriptions",
      color: "text-blue-600"
    },
    {
      icon: DollarSign,
      title: "Coût Total",
      value: `${totalCost.toFixed(2)}€`,
      description: "Ce mois-ci",
      color: "text-purple-600"
    },
    {
      icon: Clock,
      title: "En Cours",
      value: activeProjects.toString(),
      description: "Projets actifs",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStats;