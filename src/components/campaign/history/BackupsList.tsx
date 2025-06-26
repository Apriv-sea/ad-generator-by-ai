
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw } from "lucide-react";

interface BackupsListProps {
  backups: any[];
  onRevert: (backupId: string) => void;
}

export const BackupsList: React.FC<BackupsListProps> = ({ backups, onRevert }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (backups.length === 0) {
    return (
      <ScrollArea className="h-96">
        <div className="text-center py-8 text-muted-foreground">
          Aucune sauvegarde disponible
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-96">
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
                  onClick={() => onRevert(backup.id)}
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
    </ScrollArea>
  );
};
