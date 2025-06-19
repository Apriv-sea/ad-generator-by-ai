
import React from "react";
import Navigation from "@/components/Navigation";
import CampaignWorkflow from "@/components/campaign/CampaignWorkflow";

const Campaigns = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Campagnes Publicitaires</h1>
          <p className="text-gray-600">
            Créez et optimisez vos campagnes publicitaires avec l'aide de l'intelligence artificielle
          </p>
        </div>
        
        <CampaignWorkflow />
      </div>
    </>
  );
};

export default Campaigns;
