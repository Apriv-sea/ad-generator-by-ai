
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HowItWorksSection: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Configurez vos clients",
      description: "Ajoutez les informations de vos clients et leur contexte métier"
    },
    {
      number: 2,
      title: "Créez vos campagnes",
      description: "Définissez vos groupes d'annonces et mots-clés principaux"
    },
    {
      number: 3,
      title: "Générez avec l'IA",
      description: "L'IA crée automatiquement titres et descriptions optimisés"
    }
  ];

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">
        Processus en 3 étapes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {steps.map((step) => (
          <div key={step.number}>
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
              {step.number}
            </div>
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
      
      <Button size="lg" onClick={() => navigate("/auth")}>
        Commencer maintenant
      </Button>
    </div>
  );
};

export default HowItWorksSection;
