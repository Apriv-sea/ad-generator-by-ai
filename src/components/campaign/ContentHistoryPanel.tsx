
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { contentHistoryService, GenerationHistory, GenerationBackup } from "@/services/history/contentHistoryService";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";
import { History, RotateCcw, Trash2, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

interface ContentHistoryPanelProps {
  sheetId: string;
  onRevert?: (data: any[][]) => void;
}

const ContentHistoryPanel: React.FC<ContentHistoryPanelProps> = ({ sheetId, onRevert }) => {
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [backups, setBackups] = useState<GenerationBackup[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [sheetId]);

  const loadData = () => {
    setHistory(enhancedContentGenerationService.getHistoryForSheet(sheetId));
    setBackups(enhancedContentGenerationService.getBackupsForSheet(sheetId));
    setStats(enhancedContentGenerationService.getStatsForSheet(sheetId));
  };

  const handleRevert = async (backupId: string) => {
    const revertData = await enhancedContentGenerationService.revertToBackup(backupId);
    if (revertData && onRevert) {
      onRevert(revertData);
      loadData(); // Recharger pour mettre à jour les statuts
    }
  };

  const handleDeleteHistory = (id: string) => {
    if (contentHistoryService.deleteGeneration(id)) {
      loadData();
      toast.success("Élément supprimé de l'historique");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-100 text-green-800';
      case 'anthropic': return 'bg-blue-100 text-blue-800';
      case 'google': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="h-5 w-5 mr-2" />
          Historique & Sauvegardes
        </CardTitle>
        <CardDescription>
          Consultez l'historique des générations et restaurez des versions précédentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalGenerations || 0}</div>
            <div className="text-sm text-muted-foreground">Générations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalBackups || 0}</div>
            <div className="text-sm text-muted-foreground">Sauvegardes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.averageTokensUsed || 0}</div>
            <div className="text-sm text-muted-foreground">Tokens moyens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.keys(stats.providersUsed || {}).length}
            </div>
            <div className="text-sm text-muted-foreground">Providers</div>
          </div>
        </div>

        <Tabs defaultValue="history">
          <TabsList className="mb-4">
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Historique ({history.length})
            </TabsTrigger>
            <TabsTrigger value="backups">
              <RotateCcw className="h-4 w-4 mr-2" />
              Sauvegardes ({backups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <ScrollArea className="h-96">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun historique disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{item.campaignName}</h4>
                          <p className="text-sm text-muted-foreground">{item.adGroupName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getProviderColor(item.provider)}>
                            {item.provider} {item.model}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHistory(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        {formatDate(item.timestamp)}
                        {item.tokensUsed && ` • ${item.tokensUsed} tokens`}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium mb-1">Titres générés:</div>
                          <div className="space-y-1">
                            {item.generatedContent.titles.slice(0, 3).map((title, i) => (
                              <div key={i} className="bg-gray-50 p-2 rounded text-xs">
                                {title}
                              </div>
                            ))}
                            {item.generatedContent.titles.length > 3 && (
                              <div className="text-muted-foreground text-xs">
                                +{item.generatedContent.titles.length - 3} autres...
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-1">Descriptions générées:</div>
                          <div className="space-y-1">
                            {item.generatedContent.descriptions.slice(0, 2).map((desc, i) => (
                              <div key={i} className="bg-gray-50 p-2 rounded text-xs">
                                {desc}
                              </div>
                            ))}
                            {item.generatedContent.descriptions.length > 2 && (
                              <div className="text-muted-foreground text-xs">
                                +{item.generatedContent.descriptions.length - 2} autres...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="backups">
            <ScrollArea className="h-96">
              {backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune sauvegarde disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <div key={backup.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Sauvegarde</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(backup.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {backup.canRevert ? (
                            <Badge variant="outline" className="text-green-600">
                              Disponible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              Utilisée
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!backup.canRevert}
                            onClick={() => handleRevert(backup.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restaurer
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        {backup.previousContent.length - 1} lignes de données
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContentHistoryPanel;
