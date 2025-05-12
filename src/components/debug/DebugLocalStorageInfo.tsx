
import React from "react";

interface DebugLocalStorageInfoProps {
  data: Record<string, string>;
}

const DebugLocalStorageInfo: React.FC<DebugLocalStorageInfoProps> = ({ data }) => {
  return (
    <div>
      <h3 className="font-medium mb-1">Données de localStorage</h3>
      <pre className="whitespace-pre-wrap text-xs bg-slate-100 p-2 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default DebugLocalStorageInfo;
