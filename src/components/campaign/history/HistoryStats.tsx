
import React from "react";

interface HistoryStatsProps {
  stats: {
    totalGenerations?: number;
    totalBackups?: number;
    averageTokensUsed?: number;
    providersUsed?: Record<string, number>;
  };
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ stats }) => {
  return (
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
  );
};
