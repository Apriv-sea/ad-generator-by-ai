// Préventeur de clics multiples - Évite les doublons d'appels
// Empêche les utilisateurs de lancer plusieurs générations par erreur

import { Logger } from './Logger';

interface ThrottledCall {
  key: string;
  timestamp: number;
  promise: Promise<any>;
  resolved: boolean;
}

export class ClickThrottler {
  private static instance: ClickThrottler;
  private logger = new Logger('ClickThrottler');
  private activeCalls = new Map<string, ThrottledCall>();
  private readonly THROTTLE_DELAY = 2000; // 2 secondes minimum entre les appels similaires

  static getInstance(): ClickThrottler {
    if (!ClickThrottler.instance) {
      ClickThrottler.instance = new ClickThrottler();
    }
    return ClickThrottler.instance;
  }

  // ==================== THROTTLING PRINCIPAL ====================

  async throttledCall<T>(
    key: string,
    asyncFunction: () => Promise<T>,
    customDelay?: number
  ): Promise<T> {
    const delay = customDelay || this.THROTTLE_DELAY;
    
    // Nettoyer les anciens appels
    this.cleanup();

    // Vérifier si un appel similaire est déjà en cours
    const existingCall = this.activeCalls.get(key);
    if (existingCall && !existingCall.resolved) {
      this.logger.debug('Call throttled - returning existing promise', { key });
      return existingCall.promise as Promise<T>;
    }

    // Vérifier si un appel similaire récent a eu lieu
    if (existingCall && Date.now() - existingCall.timestamp < delay) {
      const remainingTime = delay - (Date.now() - existingCall.timestamp);
      this.logger.debug('Call throttled - too recent', { key, remainingTime });
      
      throw new Error(`Veuillez attendre ${Math.ceil(remainingTime / 1000)} seconde(s) avant de réessayer`);
    }

    // Créer et exécuter le nouvel appel
    const promise = this.executeCall(asyncFunction);
    
    const throttledCall: ThrottledCall = {
      key,
      timestamp: Date.now(),
      promise,
      resolved: false
    };

    this.activeCalls.set(key, throttledCall);

    try {
      const result = await promise;
      throttledCall.resolved = true;
      return result;
    } catch (error) {
      throttledCall.resolved = true;
      throw error;
    }
  }

  // ==================== EXÉCUTION SÉCURISÉE ====================

  private async executeCall<T>(asyncFunction: () => Promise<T>): Promise<T> {
    try {
      return await asyncFunction();
    } catch (error) {
      this.logger.error('Throttled call failed', { error: error.message });
      throw error;
    }
  }

  // ==================== NETTOYAGE ====================

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // Nettoyer les appels de plus de 10 minutes

    for (const [key, call] of this.activeCalls.entries()) {
      if (call.resolved || now - call.timestamp > maxAge) {
        this.activeCalls.delete(key);
      }
    }
  }

  // ==================== UTILITAIRES SPÉCIALISÉS ====================

  // Pour les générations de contenu
  async throttleContentGeneration<T>(
    sheetId: string,
    clientId: string,
    asyncFunction: () => Promise<T>
  ): Promise<T> {
    const key = `content_${sheetId}_${clientId}`;
    return this.throttledCall(key, asyncFunction, 3000); // 3 secondes pour les générations
  }

  // Pour les sauvegardes de feuilles
  async throttleSheetSave<T>(
    sheetId: string,
    asyncFunction: () => Promise<T>
  ): Promise<T> {
    const key = `save_${sheetId}`;
    return this.throttledCall(key, asyncFunction, 1000); // 1 seconde pour les sauvegardes
  }

  // Pour les analyses de contexte client
  async throttleClientAnalysis<T>(
    clientId: string,
    asyncFunction: () => Promise<T>
  ): Promise<T> {
    const key = `analysis_${clientId}`;
    return this.throttledCall(key, asyncFunction, 5000); // 5 secondes pour les analyses
  }

  // ==================== GESTION DES ÉTATS ====================

  isCallActive(key: string): boolean {
    const call = this.activeCalls.get(key);
    return call ? !call.resolved : false;
  }

  getActiveCalls(): string[] {
    return Array.from(this.activeCalls.keys()).filter(key => 
      !this.activeCalls.get(key)?.resolved
    );
  }

  cancelCall(key: string): boolean {
    const call = this.activeCalls.get(key);
    if (call && !call.resolved) {
      call.resolved = true;
      this.activeCalls.delete(key);
      this.logger.info('Call cancelled', { key });
      return true;
    }
    return false;
  }

  cancelAllCalls(): number {
    const activeKeys = this.getActiveCalls();
    activeKeys.forEach(key => this.cancelCall(key));
    return activeKeys.length;
  }

  // ==================== HOOKS REACT ====================

  // Créer une clé unique pour un composant React
  createComponentKey(componentName: string, props: Record<string, any> = {}): string {
    const propsStr = Object.entries(props)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `${componentName}_${propsStr}`;
  }

  // ==================== STATISTIQUES ====================

  getStats() {
    const now = Date.now();
    const activeCalls = Array.from(this.activeCalls.values());
    
    return {
      totalCalls: this.activeCalls.size,
      activeCalls: activeCalls.filter(call => !call.resolved).length,
      resolvedCalls: activeCalls.filter(call => call.resolved).length,
      oldestCall: activeCalls.length > 0 
        ? Math.min(...activeCalls.map(call => now - call.timestamp))
        : 0
    };
  }
}

// ==================== HOOK REACT ====================

import { useCallback, useRef } from 'react';

export function useThrottledCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  key: string,
  delay?: number
): T {
  const throttler = ClickThrottler.getInstance();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: any[]) => {
      return throttler.throttledCall(
        key,
        () => callbackRef.current(...args),
        delay
      );
    }) as T,
    [key, delay]
  );
}