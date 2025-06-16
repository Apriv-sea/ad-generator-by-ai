
export interface GenerationHistory {
  id: string;
  timestamp: Date;
  sheetId: string;
  campaignName: string;
  adGroupName: string;
  generatedContent: {
    titles: string[];
    descriptions: string[];
  };
  provider: string;
  model: string;
  prompt: any;
  tokensUsed?: number;
  validationResults?: any;
}

export interface GenerationBackup {
  id: string;
  sheetId: string;
  previousContent: any[][];
  newContent: any[][];
  timestamp: Date;
  canRevert: boolean;
}

class ContentHistoryService {
  private readonly HISTORY_KEY = 'content_generation_history';
  private readonly BACKUP_KEY = 'content_generation_backups';
  private readonly MAX_HISTORY_ITEMS = 100;
  private readonly MAX_BACKUP_ITEMS = 20;

  saveGeneration(history: Omit<GenerationHistory, 'id' | 'timestamp'>): string {
    const generationId = this.generateId();
    const fullHistory: GenerationHistory = {
      ...history,
      id: generationId,
      timestamp: new Date()
    };

    const existing = this.getHistory();
    existing.unshift(fullHistory);

    // Limiter le nombre d'éléments
    if (existing.length > this.MAX_HISTORY_ITEMS) {
      existing.splice(this.MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(existing));
    console.log(`Génération sauvegardée: ${generationId}`);
    
    return generationId;
  }

  getHistory(sheetId?: string): GenerationHistory[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (!stored) return [];

      const history: GenerationHistory[] = JSON.parse(stored).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));

      return sheetId 
        ? history.filter(h => h.sheetId === sheetId)
        : history;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      return [];
    }
  }

  getGenerationById(id: string): GenerationHistory | null {
    const history = this.getHistory();
    return history.find(h => h.id === id) || null;
  }

  deleteGeneration(id: string): boolean {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(h => h.id !== id);
      
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filteredHistory));
      console.log(`Génération supprimée: ${id}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }

  createBackup(sheetId: string, previousContent: any[][], newContent: any[][]): string {
    const backupId = this.generateId();
    const backup: GenerationBackup = {
      id: backupId,
      sheetId,
      previousContent: JSON.parse(JSON.stringify(previousContent)), // Deep copy
      newContent: JSON.parse(JSON.stringify(newContent)), // Deep copy
      timestamp: new Date(),
      canRevert: true
    };

    const existing = this.getBackups();
    existing.unshift(backup);

    // Limiter le nombre de backups
    if (existing.length > this.MAX_BACKUP_ITEMS) {
      existing.splice(this.MAX_BACKUP_ITEMS);
    }

    localStorage.setItem(this.BACKUP_KEY, JSON.stringify(existing));
    console.log(`Backup créé: ${backupId}`);
    
    return backupId;
  }

  getBackups(sheetId?: string): GenerationBackup[] {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      if (!stored) return [];

      const backups: GenerationBackup[] = JSON.parse(stored).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));

      return sheetId 
        ? backups.filter(b => b.sheetId === sheetId)
        : backups;
    } catch (error) {
      console.error('Erreur lors du chargement des backups:', error);
      return [];
    }
  }

  getBackupById(id: string): GenerationBackup | null {
    const backups = this.getBackups();
    return backups.find(b => b.id === id) || null;
  }

  canRevertToBackup(id: string): boolean {
    const backup = this.getBackupById(id);
    return backup?.canRevert || false;
  }

  getRevertData(id: string): any[][] | null {
    const backup = this.getBackupById(id);
    return backup?.canRevert ? backup.previousContent : null;
  }

  markBackupAsUsed(id: string): boolean {
    try {
      const backups = this.getBackups();
      const backup = backups.find(b => b.id === id);
      
      if (backup) {
        backup.canRevert = false;
        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du backup:', error);
      return false;
    }
  }

  clearHistory(): boolean {
    try {
      localStorage.removeItem(this.HISTORY_KEY);
      console.log('Historique effacé');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'historique:', error);
      return false;
    }
  }

  clearBackups(): boolean {
    try {
      localStorage.removeItem(this.BACKUP_KEY);
      console.log('Backups effacés');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement des backups:', error);
      return false;
    }
  }

  getStats(sheetId?: string): {
    totalGenerations: number;
    totalBackups: number;
    providersUsed: { [key: string]: number };
    averageTokensUsed: number;
    lastGeneration?: Date;
  } {
    const history = this.getHistory(sheetId);
    const backups = this.getBackups(sheetId);

    const providersUsed: { [key: string]: number } = {};
    let totalTokens = 0;
    let tokenCount = 0;

    history.forEach(h => {
      providersUsed[h.provider] = (providersUsed[h.provider] || 0) + 1;
      if (h.tokensUsed) {
        totalTokens += h.tokensUsed;
        tokenCount++;
      }
    });

    return {
      totalGenerations: history.length,
      totalBackups: backups.length,
      providersUsed,
      averageTokensUsed: tokenCount > 0 ? Math.round(totalTokens / tokenCount) : 0,
      lastGeneration: history.length > 0 ? history[0].timestamp : undefined
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const contentHistoryService = new ContentHistoryService();
