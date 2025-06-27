
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Zap, Shield } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: "IA Multi-Modèles",
      description: "OpenAI, Anthropic, Gemini selon vos besoins"
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

  return (
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
  );
};

export default FeaturesSection;
