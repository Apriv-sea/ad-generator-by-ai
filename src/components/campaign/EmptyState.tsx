
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const EmptyState: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Sélectionnez une feuille pour commencer à gérer les campagnes
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
