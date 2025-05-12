
import React from "react";

interface DebugUrlInfoProps {
  urlInfo: {
    href: string;
    hash: string;
    pathname: string;
    search: string;
    origin: string;
  };
}

const DebugUrlInfo: React.FC<DebugUrlInfoProps> = ({ urlInfo }) => {
  return (
    <div>
      <h3 className="font-medium mb-1">Informations URL</h3>
      <pre className="whitespace-pre-wrap text-xs bg-slate-100 p-2 rounded">
        {JSON.stringify(urlInfo, null, 2)}
      </pre>
    </div>
  );
};

export default DebugUrlInfo;
