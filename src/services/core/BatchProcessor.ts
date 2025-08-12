// Gestionnaire de traitement par lots - Performance optimisée
// Traite plusieurs lignes en parallèle au lieu d'une par une

import { Logger } from './Logger';
import { 
  ServiceResponse, GeneratedContent, GenerationOptions,
  Client, Campaign, AdGroup 
} from '@/types/unified';

interface BatchJob {
  id: string;
  rowIndex: number;
  options: GenerationOptions;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ServiceResponse<GeneratedContent>;
  error?: string;
}

interface BatchResult {
  successful: BatchJob[];
  failed: BatchJob[];
  totalTime: number;
  cacheHits: number;
}

export class BatchProcessor {
  private static instance: BatchProcessor;
  private logger = new Logger('BatchProcessor');
  private activeJobs = new Map<string, BatchJob>();
  private readonly BATCH_SIZE = 5; // Traiter 5 lignes à la fois
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000; // 1 seconde entre les tentatives

  static getInstance(): BatchProcessor {
    if (!BatchProcessor.instance) {
      BatchProcessor.instance = new BatchProcessor();
    }
    return BatchProcessor.instance;
  }

  // ==================== TRAITEMENT PRINCIPAL ====================

  async processBatch(
    jobs: Array<{
      rowIndex: number;
      options: GenerationOptions;
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchResult> {
    const startTime = Date.now();
    this.logger.info(`Starting batch processing`, { 
      jobCount: jobs.length,
      batchSize: this.BATCH_SIZE 
    });

    // Créer les jobs
    const batchJobs: BatchJob[] = jobs.map(job => ({
      id: `job_${job.rowIndex}_${Date.now()}`,
      rowIndex: job.rowIndex,
      options: job.options,
      retries: 0,
      status: 'pending'
    }));

    // Diviser en lots de taille BATCH_SIZE
    const batches = this.chunkArray(batchJobs, this.BATCH_SIZE);
    const results: BatchJob[] = [];
    let cacheHits = 0;

    // Traiter chaque lot en parallèle
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.debug(`Processing batch ${i + 1}/${batches.length}`, {
        batchSize: batch.length
      });

      // Traitement parallèle du lot
      const batchResults = await Promise.allSettled(
        batch.map(job => this.processJob(job))
      );

      // Collecter les résultats
      batchResults.forEach((result, index) => {
        const job = batch[index];
        
        if (result.status === 'fulfilled') {
          job.result = result.value;
          job.status = result.value.success ? 'completed' : 'failed';
          
          // Compter les cache hits
          if (result.value.metadata?.cacheHit) {
            cacheHits++;
          }
        } else {
          job.status = 'failed';
          job.error = result.reason?.message || 'Unknown error';
        }
        
        results.push(job);
      });

      // Notifier du progrès
      if (onProgress) {
        const completed = (i + 1) * this.BATCH_SIZE;
        onProgress(Math.min(completed, jobs.length), jobs.length);
      }

      // Petite pause entre les lots pour éviter de surcharger l'API
      if (i < batches.length - 1) {
        await this.delay(500);
      }
    }

    const totalTime = Date.now() - startTime;
    const successful = results.filter(job => job.status === 'completed');
    const failed = results.filter(job => job.status === 'failed');

    this.logger.info(`Batch processing completed`, {
      total: jobs.length,
      successful: successful.length,
      failed: failed.length,
      cacheHits,
      totalTime: `${totalTime}ms`,
      avgTimePerJob: `${Math.round(totalTime / jobs.length)}ms`
    });

    return {
      successful,
      failed,
      totalTime,
      cacheHits
    };
  }

  // ==================== TRAITEMENT INDIVIDUEL ====================

  private async processJob(job: BatchJob): Promise<ServiceResponse<GeneratedContent>> {
    try {
      job.status = 'processing';
      this.activeJobs.set(job.id, job);

      // Ici on appellerait le PromptEngine
      // Pour l'instant, simulation du traitement
      const result = await this.simulateGeneration(job.options);
      
      this.activeJobs.delete(job.id);
      return result;

    } catch (error) {
      this.activeJobs.delete(job.id);
      
      // Retry logic
      if (job.retries < this.MAX_RETRIES) {
        job.retries++;
        this.logger.warn(`Job ${job.id} failed, retrying (${job.retries}/${this.MAX_RETRIES})`, {
          error: error.message
        });
        
        await this.delay(this.RETRY_DELAY * job.retries);
        return this.processJob(job);
      }

      this.logger.error(`Job ${job.id} failed after ${this.MAX_RETRIES} retries`, {
        error: error.message
      });

      return {
        success: false,
        error: {
          code: 'JOB_FAILED',
          message: error.message || 'Job processing failed',
          retryable: false
        },
        metadata: {
          requestId: job.id,
          timestamp: new Date().toISOString(),
          processingTime: 0
        }
      };
    }
  }

  // ==================== SIMULATION (À REMPLACER) ====================

  private async simulateGeneration(options: GenerationOptions): Promise<ServiceResponse<GeneratedContent>> {
    // Simulation d'un appel API
    await this.delay(Math.random() * 2000 + 1000); // 1-3 secondes

    // Simulation cache hit (30% de chance)
    const isCacheHit = Math.random() < 0.3;

    return {
      success: true,
      data: {
        titles: Array.from({ length: 15 }, (_, i) => `Titre ${i + 1}`),
        descriptions: Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`),
        metadata: {
          model: options.model,
          promptId: `prompt_${Date.now()}`,
          industry: options.industry || 'default',
          timestamp: new Date().toISOString(),
          validationScore: 0.85,
          processingTime: 1500,
          retryCount: 0
        }
      },
      metadata: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
        processingTime: 1500,
        cacheHit: isCacheHit
      }
    };
  }

  // ==================== UTILITAIRES ====================

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== GESTION DES ÉTATS ====================

  getActiveJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  getJobStatus(jobId: string): BatchJob | undefined {
    return this.activeJobs.get(jobId);
  }

  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      this.activeJobs.delete(jobId);
      return true;
    }
    return false;
  }

  cancelAllJobs(): number {
    const cancelledCount = this.activeJobs.size;
    this.activeJobs.forEach(job => {
      job.status = 'failed';
      job.error = 'Cancelled by user';
    });
    this.activeJobs.clear();
    
    this.logger.info(`Cancelled ${cancelledCount} active jobs`);
    return cancelledCount;
  }

  // ==================== MÉTRIQUES ====================

  getPerformanceStats() {
    return {
      activeJobs: this.activeJobs.size,
      batchSize: this.BATCH_SIZE,
      maxRetries: this.MAX_RETRIES
    };
  }
}