
import { localStorageUtils } from "./localStorageUtils";
import { cryptpadService } from "../cryptpad/cryptpadService";

interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxRetries: number;
}

interface PendingChange {
  id: string;
  sheetId: string;
  data: any[][];
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'saving' | 'saved' | 'failed';
}

class AutoSaveService {
  private config: AutoSaveConfig = {
    enabled: true,
    intervalMs: 30000, // 30 secondes
    maxRetries: 3
  };

  private pendingChanges: Map<string, PendingChange> = new Map();
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly storageKey = 'autosave_pending_changes';

  constructor() {
    this.loadPendingChanges();
    this.startPeriodicSave();
  }

  /**
   * Programmer une sauvegarde automatique
   */
  scheduleAutoSave(sheetId: string, data: any[][]): void {
    if (!this.config.enabled) return;

    const changeId = `${sheetId}_${Date.now()}`;
    const change: PendingChange = {
      id: changeId,
      sheetId,
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    // Annuler le timer précédent s'il existe
    const existingTimer = this.saveTimers.get(sheetId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Ajouter le changement aux changements en attente
    this.pendingChanges.set(changeId, change);
    this.savePendingChanges();

    // Programmer la sauvegarde avec un délai
    const timer = setTimeout(() => {
      this.executeSave(changeId);
    }, this.config.intervalMs);

    this.saveTimers.set(sheetId, timer);

    console.log(`Sauvegarde automatique programmée pour ${sheetId} dans ${this.config.intervalMs / 1000}s`);
  }

  /**
   * Forcer une sauvegarde immédiate
   */
  async forceSave(sheetId: string, data: any[][]): Promise<boolean> {
    const changeId = `${sheetId}_force_${Date.now()}`;
    const change: PendingChange = {
      id: changeId,
      sheetId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    return await this.executeSave(changeId, change);
  }

  /**
   * Exécuter une sauvegarde
   */
  private async executeSave(changeId: string, change?: PendingChange): Promise<boolean> {
    const changeToSave = change || this.pendingChanges.get(changeId);
    if (!changeToSave) {
      console.warn(`Changement ${changeId} non trouvé`);
      return false;
    }

    changeToSave.status = 'saving';
    this.savePendingChanges();

    try {
      console.log(`Sauvegarde en cours pour ${changeToSave.sheetId}...`);
      
      const success = await cryptpadService.saveSheetData(
        changeToSave.sheetId, 
        changeToSave.data
      );

      if (success) {
        changeToSave.status = 'saved';
        this.pendingChanges.delete(changeId);
        console.log(`✅ Sauvegarde réussie pour ${changeToSave.sheetId}`);
        
        // Nettoyer le timer
        this.saveTimers.delete(changeToSave.sheetId);
        
        this.savePendingChanges();
        return true;
      } else {
        throw new Error('Échec de la sauvegarde');
      }
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${changeToSave.sheetId}:`, error);
      
      changeToSave.retryCount++;
      
      if (changeToSave.retryCount < this.config.maxRetries) {
        changeToSave.status = 'pending';
        console.log(`Nouvelle tentative prévue (${changeToSave.retryCount}/${this.config.maxRetries})`);
        
        // Programmer une nouvelle tentative avec un délai croissant
        setTimeout(() => {
          this.executeSave(changeId);
        }, 5000 * changeToSave.retryCount);
      } else {
        changeToSave.status = 'failed';
        console.error(`Sauvegarde échouée définitivement pour ${changeToSave.sheetId}`);
      }
      
      this.savePendingChanges();
      return false;
    }
  }

  /**
   * Obtenir l'état des sauvegardes en attente
   */
  getPendingChanges(): PendingChange[] {
    return Array.from(this.pendingChanges.values());
  }

  /**
   * Obtenir l'état pour une feuille spécifique
   */
  getSheetStatus(sheetId: string): { 
    hasPending: boolean; 
    lastSave?: number; 
    status?: string 
  } {
    const changes = Array.from(this.pendingChanges.values())
      .filter(change => change.sheetId === sheetId);
    
    if (changes.length === 0) {
      return { hasPending: false };
    }

    const latest = changes.sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return {
      hasPending: true,
      lastSave: latest.timestamp,
      status: latest.status
    };
  }

  /**
   * Configurer le service
   */
  configure(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Activer/désactiver la sauvegarde automatique
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      // Annuler tous les timers en cours
      for (const timer of this.saveTimers.values()) {
        clearTimeout(timer);
      }
      this.saveTimers.clear();
    }
  }

  /**
   * Démarrer la sauvegarde périodique pour les changements en attente
   */
  private startPeriodicSave(): void {
    setInterval(() => {
      this.processPendingChanges();
    }, 60000); // Vérifier toutes les minutes
  }

  /**
   * Traiter les changements en attente
   */
  private async processPendingChanges(): Promise<void> {
    const pendingChanges = Array.from(this.pendingChanges.values())
      .filter(change => change.status === 'pending');

    for (const change of pendingChanges) {
      // Sauvegarder les changements anciens (plus de 2 minutes)
      if (Date.now() - change.timestamp > 120000) {
        await this.executeSave(change.id);
      }
    }
  }

  /**
   * Charger les changements en attente depuis le localStorage
   */
  private loadPendingChanges(): void {
    const stored = localStorageUtils.getItem<PendingChange[]>(this.storageKey) || [];
    
    stored.forEach(change => {
      this.pendingChanges.set(change.id, change);
    });
  }

  /**
   * Sauvegarder les changements en attente dans le localStorage
   */
  private savePendingChanges(): void {
    const changes = Array.from(this.pendingChanges.values());
    localStorageUtils.setItem(this.storageKey, changes);
  }
}

export const autoSaveService = new AutoSaveService();
