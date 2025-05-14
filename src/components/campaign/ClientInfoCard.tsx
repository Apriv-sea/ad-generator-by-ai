
import React, { useState } from "react";
import { Client } from "@/services/types/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Campaign } from "@/services/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ClientInfoCardProps {
  clientInfo: Client | null;
  campaigns?: Campaign[];
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({ clientInfo, campaigns = [] }) => {
  const [showClientInfo, setShowClientInfo] = useState(false);

  const toggleClientInfo = () => {
    setShowClientInfo(!showClientInfo);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Contexte client utilisé pour la génération de contenu
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={toggleClientInfo}>
          <Info className="h-4 w-4 mr-2" />
          {showClientInfo ? "Masquer les détails" : "Voir les détails"}
        </Button>
      </CardHeader>
      {showClientInfo && (
        <CardContent>
          {clientInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Client</h3>
                <p className="text-base">{clientInfo.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Contexte métier</h3>
                <p className="text-sm text-muted-foreground">{clientInfo.businessContext || "Non défini"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Spécificités</h3>
                <p className="text-sm text-muted-foreground">{clientInfo.specifics || "Non défini"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Charte éditoriale</h3>
                <p className="text-sm text-muted-foreground">{clientInfo.editorialGuidelines || "Non défini"}</p>
              </div>
              
              {campaigns && campaigns.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Contextes des campagnes et groupes d'annonces</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {campaigns.map((campaign, index) => (
                      <AccordionItem key={index} value={`campaign-${index}`}>
                        <AccordionTrigger className="text-sm font-medium">
                          Campagne: {campaign.name || "Sans nom"}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 py-2">
                            <div className="mb-3">
                              <h4 className="text-xs font-medium text-muted-foreground">Contexte de la campagne</h4>
                              <p className="text-sm">{campaign.context || "Aucun contexte défini"}</p>
                            </div>
                            
                            {campaign.adGroups && campaign.adGroups.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Groupes d'annonces</h4>
                                <Accordion type="single" collapsible className="w-full">
                                  {campaign.adGroups.map((adGroup, adIndex) => (
                                    <AccordionItem key={adIndex} value={`adgroup-${index}-${adIndex}`}>
                                      <AccordionTrigger className="text-xs font-medium">
                                        {adGroup.name || "Sans nom"}
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="pl-4 py-2">
                                          <h5 className="text-xs font-medium text-muted-foreground">Contexte du groupe</h5>
                                          <p className="text-xs">{adGroup.context || "Aucun contexte défini"}</p>
                                          
                                          <h5 className="text-xs font-medium text-muted-foreground mt-2">Mots-clés</h5>
                                          <p className="text-xs">
                                            {adGroup.keywords && adGroup.keywords.filter(k => k.trim()).length > 0 
                                              ? adGroup.keywords.filter(k => k.trim()).join(", ")
                                              : "Aucun mot-clé défini"}
                                          </p>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune information client disponible</p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ClientInfoCard;
