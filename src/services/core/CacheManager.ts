// Gestionnaire de cache intelligent - Économise les appels API
// Cache multi-niveaux : mémoire → localStorage → base de données

import { Logger } from './Logger';
import { GenerationOptions, GeneratedContent, ServiceResponse } from '@/types/unified';

interface CacheEntry {
  key: string;
  data: GeneratedContent;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  memorySize: number;
  storageSize: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private logger = new Logger('CacheManager');
  
  // Cache en mémoire (niveau 1 - le plus rapide)
  private memoryCache = new Map<string, CacheEntry>();
  
  // Configuration
  private readonly MEMORY_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly STORAGE_TTL = 2 * 60 * 60 * 1000; // 2 heures
  private readonly MAX_MEMORY_ENTRIES = 100;
  private readonly MAX_STORAGE_ENTRIES = 500;
  
  // Statistiques
  private stats: CacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    memorySize: 0,
    storageSize: 0
  };

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // ==================== GÉNÉRATION DE CLÉS ====================

  generateCacheKey(options: GenerationOptions): string {
    // Créer une clé unique basée sur les paramètres importants
    const keyParts = [
      options.client.industry || 'default',
      options.adGroup.keywords.slice(0, 3).sort().join('-'), // Max 3 mots-clés pour éviter clés trop longues
      options.model.split(':')[1] || options.model, // Juste le nom du modèle
      options.client.targetPersona ? 'persona' : 'no-persona'
    ];

    const baseKey = keyParts.join('|').toLowerCase();
    
    // Hash simple pour raccourcir la clé
    let hash = 0;
    for (let i = 0; i < baseKey.length; i++) {
      hash = ((hash << 5) - hash + baseKey.charCodeAt(i)) & 0xffffffff;
    }
    
    return `cache_${Math.abs(hash).toString(36)}`;
  }

  // ==================== RÉCUPÉRATION DU CACHE ====================

  async get(cacheKey: string): Promise<GeneratedContent | null> {
    this.stats.totalRequests++;

    try {
      // Niveau 1: Mémoire (le plus rapide)
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry && this.isEntryValid(memoryEntry)) {
        memoryEntry.accessCount++;
        memoryEntry.lastAccessed = Date.now();
        this.stats.cacheHits++;
        this.updateHitRate();
        
        this.logger.debug('Cache hit (memory)', { cacheKey });
        return memoryEntry.data;
      }

      // Niveau 2: LocalStorage
      const storageEntry = this.getFromStorage(cacheKey);
      if (storageEntry && this.isEntryValid(storageEntry, this.STORAGE_TTL)) {
        // Remonter en mémoire pour accès plus rapide
        this.setInMemory(cacheKey, storageEntry.data, storageEntry.ttl);
        
        this.stats.cacheHits++;
        this.updateHitRate();
        
        this.logger.debug('Cache hit (storage)', { cacheKey });
        return storageEntry.data;
      }

      // Cache miss
      this.stats.cacheMisses++;
      this.updateHitRate();
      
      this.logger.debug('Cache miss', { cacheKey });
      return null;

    } catch (error) {
      this.logger.error('Cache retrieval error', { error: error.message, cacheKey });
      this.stats.cacheMisses++;
      this.updateHitRate();
      return null;
    }
  }

  // ==================== STOCKAGE EN CACHE ====================

  async set(
    cacheKey: string, 
    data: GeneratedContent, 
    ttl: number = this.MEMORY_TTL
  ): Promise<void> {
    try {
      // Stocker en mémoire
      this.setInMemory(cacheKey, data, ttl);
      
      // Stocker dans localStorage avec TTL plus long
      this.setInStorage(cacheKey, data, this.STORAGE_TTL);
      
      this.logger.debug('Content cached', { 
        cacheKey, 
        memorySize: this.memoryCache.size 
      });

    } catch (error) {
      this.logger.error('Cache storage error', { error: error.message, cacheKey });
    }
  }

  // ==================== CACHE MÉMOIRE ====================

  private setInMemory(cacheKey: string, data: GeneratedContent, ttl: number): void {
    // Nettoyer si nécessaire
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      this.cleanupMemoryCache();
    }

    const entry: CacheEntry = {
      key: cacheKey,
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.memoryCache.set(cacheKey, entry);
    this.updateStats();
  }

  private cleanupMemoryCache(): void {
    // Supprimer les entrées expirées
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isEntryValid(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Si encore trop d'entrées, supprimer les moins utilisées
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      const entries = Array.from(this.memoryCache.entries());
      
      // Trier par dernière utilisation (les plus anciennes en premier)
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Supprimer les 20% les plus anciennes
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }

    this.logger.debug('Memory cache cleaned', { size: this.memoryCache.size });
  }

  // ==================== CACHE LOCALSTORAGE ====================

  private setInStorage(cacheKey: string, data: GeneratedContent, ttl: number): void {
    try {
      const entry: CacheEntry = {
        key: cacheKey,
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 1,
        lastAccessed: Date.now()
      };

      // Récupérer le cache existant
      const existingCache = this.getAllStorageEntries();
      existingCache[cacheKey] = entry;

      // Nettoyer si nécessaire
      const cleanedCache = this.cleanupStorageCache(existingCache);
      
      // Sauvegarder
      localStorage.setItem('content_cache', JSON.stringify(cleanedCache));
      
    } catch (error) {
      // LocalStorage peut être plein ou indisponible
      this.logger.warn('Storage cache failed', { error: error.message });
    }
  }

  private getFromStorage(cacheKey: string): CacheEntry | null {
    try {
      const cacheData = localStorage.getItem('content_cache');
      if (!cacheData) return null;

      const cache = JSON.parse(cacheData);
      return cache[cacheKey] || null;

    } catch (error) {
      this.logger.warn('Storage retrieval failed', { error: error.message });
      return null;
    }
  }

  private getAllStorageEntries(): Record<string, CacheEntry> {
    try {
      const cacheData = localStorage.getItem('content_cache');
      return cacheData ? JSON.parse(cacheData) : {};
    } catch (error) {
      return {};
    }
  }

  private cleanupStorageCache(cache: Record<string, CacheEntry>): Record<string, CacheEntry> {
    const now = Date.now();
    const validEntries: Record<string, CacheEntry> = {};

    // Garder seulement les entrées valides
    for (const [key, entry] of Object.entries(cache)) {
      if (this.isEntryValid(entry, this.STORAGE_TTL)) {
        validEntries[key] = entry;
      }
    }

    // Si encore trop d'entrées, garder les plus récentes
    const entries = Object.entries(validEntries);
    if (entries.length > this.MAX_STORAGE_ENTRIES) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      const finalEntries: Record<string, CacheEntry> = {};
      for (let i = 0; i < this.MAX_STORAGE_ENTRIES; i++) {
        const [key, entry] = entries[i];
        finalEntries[key] = entry;
      }
      return finalEntries;
    }

    return validEntries;
  }

  // ==================== VALIDATION ====================

  private isEntryValid(entry: CacheEntry, customTtl?: number): boolean {
    const ttl = customTtl || entry.ttl;
    return Date.now() - entry.timestamp < ttl;
  }

  // ==================== STATISTIQUES ====================

  private updateStats(): void {
    this.stats.memorySize = this.memoryCache.size;
    
    try {
      const storageData = localStorage.getItem('content_cache');
      this.stats.storageSize = storageData ? Object.keys(JSON.parse(storageData)).length : 0;
    } catch {
      this.stats.storageSize = 0;
    }
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;
  }

  // ==================== API PUBLIQUE ====================

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
    this.logger.info('Memory cache cleared');
    this.updateStats();
  }

  clearStorageCache(): void {
    try {
      localStorage.removeItem('content_cache');
      this.logger.info('Storage cache cleared');
    } catch (error) {
      this.logger.warn('Storage cache clear failed', { error: error.message });
    }
    this.updateStats();
  }

  clearAllCache(): void {
    this.clearMemoryCache();
    this.clearStorageCache();
    
    // Reset stats
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      memorySize: 0,
      storageSize: 0
    };
  }

  // ==================== PRÉCHARGEMENT ====================

  async preloadCommonPatterns(industries: string[]): Promise<void> {
    // Cette méthode pourrait précharger des patterns communs
    // Pour l'instant, on log juste l'intention
    this.logger.info('Preloading cache patterns', { industries });
  }
}