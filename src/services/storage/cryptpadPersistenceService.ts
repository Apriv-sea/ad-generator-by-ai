
import { localStorageUtils } from "./localStorageUtils";
import { Campaign, Client } from "../types";

interface CryptPadSession {
  id: string;
  padId: string;
  name: string;
  lastConnected: string;
  dataPreview?: {
    headers: string[];
    rowCount: number;
    sampleData: string[][];
  };
  clientInfo?: Client;
  campaigns?: Campaign[];
}

class CryptPadPersistenceService {
  private readonly storageKey = 'cryptpad_sessions';
  private readonly maxSessions = 10; // Limite pour éviter l'encombrement

  /**
   * Sauvegarder une session CryptPad
   */
  saveSession(padId: string, data: {
    name?: string;
    sheetData?: any;
    clientInfo?: Client;
    campaigns?: Campaign[];
  }): void {
    try {
      const sessions = this.getSessions();
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: CryptPadSession = {
        id: sessionId,
        padId,
        name: data.name || `Feuille ${new Date().toLocaleDateString()}`,
        lastConnected: new Date().toISOString(),
        clientInfo: data.clientInfo,
        campaigns: data.campaigns
      };

      // Ajouter un aperçu des données si disponible
      if (data.sheetData?.values) {
        session.dataPreview = {
          headers: data.sheetData.values[0] || [],
          rowCount: data.sheetData.values.length,
          sampleData: data.sheetData.values.slice(0, 3)
        };
      }

      // Ajouter la nouvelle session
      sessions.unshift(session);

      // Limiter le nombre de sessions stockées
      if (sessions.length > this.maxSessions) {
        sessions.splice(this.maxSessions);
      }

      localStorageUtils.setItem(this.storageKey, sessions);
      console.log("Session CryptPad sauvegardée:", sessionId);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la session CryptPad:", error);
    }
  }

  /**
   * Récupérer toutes les sessions sauvegardées
   */
  getSessions(): CryptPadSession[] {
    return localStorageUtils.getItem<CryptPadSession[]>(this.storageKey) || [];
  }

  /**
   * Récupérer une session spécifique par padId
   */
  getSessionByPadId(padId: string): CryptPadSession | null {
    const sessions = this.getSessions();
    return sessions.find(session => session.padId === padId) || null;
  }

  /**
   * Mettre à jour les données d'une session existante
   */
  updateSession(padId: string, updates: Partial<CryptPadSession>): void {
    try {
      const sessions = this.getSessions();
      const sessionIndex = sessions.findIndex(session => session.padId === padId);

      if (sessionIndex !== -1) {
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          ...updates,
          lastConnected: new Date().toISOString()
        };
        localStorageUtils.setItem(this.storageKey, sessions);
        console.log("Session CryptPad mise à jour:", padId);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la session:", error);
    }
  }

  /**
   * Supprimer une session
   */
  removeSession(sessionId: string): void {
    try {
      const sessions = this.getSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      localStorageUtils.setItem(this.storageKey, filteredSessions);
      console.log("Session CryptPad supprimée:", sessionId);
    } catch (error) {
      console.error("Erreur lors de la suppression de la session:", error);
    }
  }

  /**
   * Nettoyer les anciennes sessions (plus de 30 jours)
   */
  cleanOldSessions(): void {
    try {
      const sessions = this.getSessions();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSessions = sessions.filter(session => {
        return new Date(session.lastConnected) > thirtyDaysAgo;
      });

      if (recentSessions.length !== sessions.length) {
        localStorageUtils.setItem(this.storageKey, recentSessions);
        console.log(`${sessions.length - recentSessions.length} anciennes sessions supprimées`);
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage des sessions:", error);
    }
  }

  /**
   * Sauvegarder l'état du workflow en cours
   */
  saveWorkflowState(padId: string, state: {
    currentStep: 'connection' | 'extraction' | 'content';
    extractedCampaigns?: Campaign[];
    generationProgress?: number;
  }): void {
    try {
      const key = `workflow_state_${padId}`;
      const workflowState = {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      localStorageUtils.setItem(key, workflowState);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'état du workflow:", error);
    }
  }

  /**
   * Récupérer l'état du workflow pour un pad
   */
  getWorkflowState(padId: string): any {
    try {
      const key = `workflow_state_${padId}`;
      return localStorageUtils.getItem(key);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'état du workflow:", error);
      return null;
    }
  }
}

export const cryptpadPersistenceService = new CryptPadPersistenceService();
