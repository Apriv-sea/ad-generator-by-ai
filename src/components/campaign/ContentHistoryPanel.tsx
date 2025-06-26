
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";
import { History, RotateCcw, Trash2, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { useMemoizedCallback } from "@/hooks/useMemoizedCallback";
import { HistoryList } from "./history/HistoryList";
import { BackupsList } from "./history/BackupsList";
import { HistoryStats } from "./history/HistoryStats";

interface ContentHistoryPanelProps {
  sheetId: string;
  onRevert?: (data: any[][]) => void;
}

const ContentHistoryPanel: React.FC<ContentHistoryPanelProps> = ({ sheetId, onRevert }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useMemoizedCallback(async () => {
    setIsLoading(true);
    try {
      const [historyData, backupsData, statsData] = await Promise.all([
        enhancedContentGenerationService.getHistoryForSheet(sheetId),
        Promise.resolve(enhancedContentGenerationService.getBackupsForSheet(sheetId)),
        enhancedContentGenerationService.getStatsForSheet(sheetId)
      ]);
      
      setHistory(historyData);
      setBackups(backupsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading history data:', error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setIsLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRevert = useMemoizedCallback(async (backupId: string) => {
    try {
      const revertData = await enhancedContentGenerationService.revertToBackup(backupId);
      if (revertData && onRevert) {
        onRevert(revertData);
        await loadData();
        toast.success("Données restaurées avec succès");
      }
    } catch (error) {
      console.error('Error reverting backup:', error);
      toast.error("Erreur lors de la restauration");
    }
  }, [onRevert, loadData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Chargement...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <HistoryStats stats={stats} />

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
            <HistoryList history={history} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="backups">
            <BackupsList backups={backups} onRevert={handleRevert} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContentHistoryPanel;
