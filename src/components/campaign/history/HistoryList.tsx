
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { contentHistoryService } from "@/services/history/contentHistoryService";
import { toast } from "sonner";
import { useCallback } from "react";

interface HistoryListProps {
  history: any[];
  onRefresh: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onRefresh }) => {
  const handleDeleteHistory = useCallback(async (id: string) => {
    if (await contentHistoryService.deleteGeneration(id)) {
      onRefresh();
      toast.success("Élément supprimé de l'historique");
    }
  }, [onRefresh]);

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

  if (history.length === 0) {
    return (
      <ScrollArea className="h-96">
        <div className="text-center py-8 text-muted-foreground">
          Aucun historique disponible
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-96">
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
                  {item.generatedContent.titles.slice(0, 3).map((title: string, i: number) => (
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
                  {item.generatedContent.descriptions.slice(0, 2).map((desc: string, i: number) => (
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
    </ScrollArea>
  );
};
