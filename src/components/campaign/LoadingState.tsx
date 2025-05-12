
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = "Chargement des données de la campagne..." }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-center py-8">
          <div className="text-center">
            <p className="mb-2">{message}</p>
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingState;
