
import React from "react";
import { Loader2 } from "lucide-react";

interface GlobalLoadingProps {
  message?: string;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({ 
  message = "Chargement..." 
}) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default GlobalLoading;
