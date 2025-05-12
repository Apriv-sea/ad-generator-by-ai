
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import DebugUrlInfo from "./DebugUrlInfo";
import DebugUserAgent from "./DebugUserAgent";
import DebugLocalStorageInfo from "./DebugLocalStorageInfo";
import DebugOAuthConfig from "./DebugOAuthConfig";
import DebugTroubleshooting from "./DebugTroubleshooting";

interface DebugInfoContentProps {
  sessionData: {
    url: {
      href: string;
      hash: string;
      pathname: string;
      search: string;
      origin: string;
    };
    userAgent: string;
    timestamp: string;
  } | null;
  localStorageData: Record<string, string>;
}

const DebugInfoContent: React.FC<DebugInfoContentProps> = ({ sessionData, localStorageData }) => {
  if (!sessionData) {
    return null;
  }
  
  return (
    <ScrollArea className="max-h-[400px] rounded border p-4 bg-slate-50">
      <div className="space-y-4">
        <DebugUrlInfo urlInfo={sessionData.url} />
        <DebugUserAgent userAgent={sessionData.userAgent} />
        <DebugLocalStorageInfo data={localStorageData} />
        <DebugOAuthConfig />
        <DebugTroubleshooting />
      </div>
    </ScrollArea>
  );
};

export default DebugInfoContent;
