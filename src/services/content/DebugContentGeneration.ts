// Service de génération unifié - Nouvelle architecture optimisée
// Remplace l'ancien DebugContentGeneration avec optimisations performance

import { PromptEngine } from '../core/PromptEngine';
import { Validator } from '../core/Validator';
import { Logger } from '../core/Logger';
import { BatchProcessor } from '../core/BatchProcessor';
import { ClickThrottler } from '../core/ClickThrottler';
import { 
  Client, Campaign, AdGroup, GenerationOptions, 
  ServiceResponse, GeneratedContent, LIMITS, PROTECTED_COLUMNS 
} from '@/types/unified';
import { supabase } from '@/integrations/supabase/client';
import { GoogleSheetsService } from '../googlesheets/googleSheetsService';
import { CampaignContextService } from '../campaign/campaignContextService';

interface LegacyContentGenerationOptions {
  model: string;
  clientContext: string;
  industry?: string;
  targetPersona?: string;
  campaignContext: string;
  adGroupContext: string;
  keywords: string[];
}

export class DebugContentGeneration {
  private static logger = new Logger('DebugContentGeneration');
  private static promptEngine = PromptEngine.getInstance();
  private static validator = new Validator();
  private static batchProcessor = BatchProcessor.getInstance();
  private static clickThrottler = ClickThrottler.getInstance();

  // ==================== NOUVEAU: TRAITEMENT PAR LOT ====================

  static async generateContentForMultipleRows(
    rows: Array<{
      rowIndex: number;
      options: LegacyContentGenerationOptions;
    }>,
    sheetId: string,
    currentSheetData: string[][],
    onProgress?: (completed: number, total: number) => void
  ): Promise<{
    success: boolean;
    results: Array<{
      rowIndex: number;
      success: boolean;
      updatedSheetData?: string[][];
      error?: string;
    }>;
    totalTime: number;
    cacheHits: number;
  }> {
    const timer = Logger.createTimer(`generateContentBatch-${rows.length}-rows`);
    
    try {
      this.logger.info(`Starting batch generation for ${rows.length} rows`, { sheetId });

      // Éviter les appels multiples simultanés
      const throttleKey = `batch_${sheetId}_${rows.map(r => r.rowIndex).join('-')}`;
      
      return await this.clickThrottler.throttledCall(throttleKey, async () => {
        // Analyser la structure de la feuille
        const sheetAnalysis = this.analyzeSheetStructure(currentSheetData);
        
        // Convertir en jobs pour le BatchProcessor
        const jobs = rows.map(row => ({
          rowIndex: row.rowIndex,
          options: this.convertToGenerationOptions(row.options, sheetAnalysis)
        }));

        // Traitement par lot
        const batchResult = await this.batchProcessor.processBatch(jobs, onProgress);
        
        // Traiter les résultats et mettre à jour la feuille
        let updatedSheetData = [...currentSheetData];
        const results = [];

        for (const job of [...batchResult.successful, ...batchResult.failed]) {
          if (job.status === 'completed' && job.result?.success) {
            try {
              updatedSheetData = await this.updateSheetWithContent(
                updatedSheetData,
                job.rowIndex,
                job.result.data!,
                sheetAnalysis
              );

              results.push({
                rowIndex: job.rowIndex,
                success: true,
                updatedSheetData: [...updatedSheetData]
              });
            } catch (error) {
              results.push({
                rowIndex: job.rowIndex,
                success: false,
                error: error.message
              });
            }
          } else {
            results.push({
              rowIndex: job.rowIndex,
              success: false,
              error: job.error || job.result?.error?.message || 'Unknown error'
            });
          }
        }

        // Sauvegarder une seule fois (batch write)
        if (batchResult.successful.length > 0) {
          const saveResult = await GoogleSheetsService.saveSheetData(sheetId, updatedSheetData);
          if (!saveResult) {
            throw new Error('Failed to save batch results to Google Sheets');
          }
        }

        this.logger.info(`Batch generation completed`, {
          total: rows.length,
          successful: batchResult.successful.length,
          failed: batchResult.failed.length,
          cacheHits: batchResult.cacheHits
        });

        timer();

        return {
          success: batchResult.successful.length > 0,
          results,
          totalTime: batchResult.totalTime,
          cacheHits: batchResult.cacheHits
        };
      });

    } catch (error) {
      this.logger.error(`Batch generation failed`, { error: error.message });
      timer();
      
      return {
        success: false,
        results: rows.map(row => ({
          rowIndex: row.rowIndex,
          success: false,
          error: error.message
        })),
        totalTime: 0,
        cacheHits: 0
      };
    }
  }

  // ==================== LEGACY: TRAITEMENT INDIVIDUEL ====================

  static async generateAndSaveContent(
    options: LegacyContentGenerationOptions,
    sheetId: string,
    rowIndex: number,
    currentSheetData: string[][]
  ): Promise<{
    success: boolean;
    updatedSheetData?: string[][];
    error?: string;
  }> {
    // Utiliser le throttler pour éviter les appels multiples
    const throttleKey = `single_${sheetId}_${rowIndex}`;
    
    return await this.clickThrottler.throttledCall(throttleKey, async () => {
      return this.executeGeneration(options, sheetId, rowIndex, currentSheetData);
    });
  }

  private static async executeGeneration(
    options: LegacyContentGenerationOptions,
    sheetId: string,
    rowIndex: number,
    currentSheetData: string[][]
  ): Promise<{
    success: boolean;
    updatedSheetData?: string[][];
    error?: string;
  }> {
    const timer = Logger.createTimer(`generateAndSaveContent-row-${rowIndex + 1}`);
    
    try {
      this.logger.info(`Starting content generation for row ${rowIndex + 1}`, {
        sheetId,
        model: options.model,
        industry: options.industry,
        adGroupContext: options.adGroupContext
      });

      // Analyze sheet structure
      const sheetAnalysis = this.analyzeSheetStructure(currentSheetData);
      
      // Convert legacy options to new format
      const generationOptions = this.convertToGenerationOptions(options, sheetAnalysis);
      
      // Get dynamic campaign context
      const campaignName = currentSheetData[rowIndex][0];
      const dynamicContext = CampaignContextService.getContextForCampaign(campaignName);
      if (dynamicContext) {
        generationOptions.campaign.context = dynamicContext;
      }

      // Generate content using new PromptEngine
      const contentResult = await this.generateContentWithRetry(generationOptions);
      
      if (!contentResult.success) {
        return {
          success: false,
          error: contentResult.error?.message || 'Content generation failed'
        };
      }

      // Update sheet with generated content
      const updatedSheetData = await this.updateSheetWithContent(
        currentSheetData,
        rowIndex,
        contentResult.data!,
        sheetAnalysis
      );

      // Save to Google Sheets
      const saveResult = await GoogleSheetsService.saveSheetData(sheetId, updatedSheetData);
      
      if (!saveResult) {
        throw new Error('Failed to save to Google Sheets');
      }

      this.logger.info(`Content generation completed successfully for row ${rowIndex + 1}`);
      timer();

      return {
        success: true,
        updatedSheetData
      };

    } catch (error) {
      this.logger.error(`Content generation failed for row ${rowIndex + 1}`, { 
        error: error.message,
        options 
      });
      timer();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== SHEET ANALYSIS ====================

  private static analyzeSheetStructure(sheetData: string[][]) {
    const headers = sheetData[0] || [];
    const titleColumns: number[] = [];
    const descriptionColumns: number[] = [];

    headers.forEach((header, index) => {
      const headerLower = String(header).toLowerCase();
      
      if (headerLower.includes('titre') || headerLower.includes('headline')) {
        titleColumns.push(index);
      } else if (headerLower.includes('description') || headerLower.includes('desc')) {
        descriptionColumns.push(index);
      }
    });

    this.logger.debug('Sheet structure analyzed', {
      totalColumns: headers.length,
      titleColumns: titleColumns.length,
      descriptionColumns: descriptionColumns.length
    });

    return {
      headers,
      titleColumns,
      descriptionColumns,
      needsExtension: titleColumns.length < LIMITS.REQUIRED_TITLES_COUNT || 
                     descriptionColumns.length < LIMITS.REQUIRED_DESCRIPTIONS_COUNT
    };
  }

  // ==================== LEGACY CONVERSION ====================

  private static convertToGenerationOptions(
    legacyOptions: LegacyContentGenerationOptions,
    sheetAnalysis: any
  ): GenerationOptions {
    // Create mock client object
    const client: Client = {
      id: 'legacy-client',
      name: 'Legacy Client',
      industry: legacyOptions.industry,
      targetPersona: legacyOptions.targetPersona,
      businessContext: legacyOptions.clientContext
    };

    // Create mock campaign object
    const campaign: Campaign = {
      id: 'legacy-campaign',
      sheetId: 'legacy-sheet',
      name: legacyOptions.campaignContext,
      context: legacyOptions.campaignContext
    };

    // Create mock ad group object
    const adGroup: AdGroup = {
      id: 'legacy-adgroup',
      campaignId: campaign.id,
      name: legacyOptions.adGroupContext,
      keywords: legacyOptions.keywords
    };

    return {
      model: legacyOptions.model,
      client,
      campaign,
      adGroup,
      industry: legacyOptions.industry,
      targetPersona: legacyOptions.targetPersona,
      temperature: 0.7,
      maxTokens: 2000
    };
  }

  // ==================== CONTENT GENERATION WITH RETRY ====================

  private static async generateContentWithRetry(
    options: GenerationOptions,
    maxRetries: number = 3
  ): Promise<ServiceResponse<GeneratedContent>> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Generation attempt ${attempt}/${maxRetries}`, { 
          model: options.model 
        });

        // Build optimized prompt
        const prompt = this.promptEngine.buildOptimizedPrompt(options);
        
        // Call LLM provider
        const rawContent = await this.callLLMProvider(options.model, prompt);
        
        // Validate and correct content
        const validationResult = await this.validator.validateContent(rawContent, {
          strictMode: true,
          autoCorrect: true,
          qualityThreshold: 0.7,
          allowPartialResults: attempt === maxRetries // Allow partial on last attempt
        });

        if (validationResult.isValid || validationResult.correctedContent) {
          const finalContent = validationResult.correctedContent || {
            titles: [],
            descriptions: [],
            metadata: {
              model: options.model,
              promptId: `attempt-${attempt}`,
              industry: options.industry || 'unknown',
              timestamp: new Date().toISOString(),
              validationScore: validationResult.score,
              processingTime: 0,
              retryCount: attempt - 1
            }
          };

          return {
            success: true,
            data: finalContent,
            metadata: {
              requestId: `req_${Date.now()}`,
              timestamp: new Date().toISOString(),
              processingTime: 0
            }
          };
        }

        lastError = new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        
        if (attempt < maxRetries) {
          this.logger.warn(`Attempt ${attempt} failed, retrying`, { 
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length 
          });
        }

      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed with error`, { error: error.message });
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'GENERATION_FAILED_ALL_RETRIES',
        message: lastError?.message || 'All generation attempts failed',
        retryable: false
      }
    };
  }

  // ==================== LLM PROVIDER CALL ====================

  private static async callLLMProvider(model: string, prompt: string): Promise<string> {
    const [provider, modelName] = model.split(':');
    
    const { data: llmResponse, error: llmError } = await supabase.functions.invoke('secure-llm-api', {
      body: {
        provider: provider || 'openai',
        model: modelName || model,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for generating advertising content.' },
          { role: 'user', content: prompt }
        ],
        maxTokens: 2000,
        temperature: 0.7
      }
    });

    if (llmError) {
      throw new Error(`LLM API error: ${llmError.message}`);
    }

    // Extract content from response
    let content = '';
    if (llmResponse?.content?.[0]?.text) {
      content = llmResponse.content[0].text;
    } else if (llmResponse?.generatedText) {
      content = llmResponse.generatedText;
    } else {
      throw new Error('Unexpected LLM response structure');
    }

    return content;
  }

  // ==================== SHEET UPDATE ====================

  private static async updateSheetWithContent(
    currentSheetData: string[][],
    rowIndex: number,
    content: GeneratedContent,
    sheetAnalysis: any
  ): Promise<string[][]> {
    const updatedSheetData = [...currentSheetData];
    
    // Extend sheet if necessary
    if (sheetAnalysis.needsExtension) {
      this.extendSheetStructure(updatedSheetData, sheetAnalysis);
      // Re-analyze after extension
      sheetAnalysis = this.analyzeSheetStructure(updatedSheetData);
    }

    // Update the target row
    const originalRow = updatedSheetData[rowIndex] || [];
    const updatedRow = [...originalRow];

    // Ensure row has enough columns
    const totalColumns = updatedSheetData[0].length;
    while (updatedRow.length < totalColumns) {
      updatedRow.push('');
    }

    // Fill title columns (avoiding protected columns)
    const maxTitles = Math.min(content.titles.length, sheetAnalysis.titleColumns.length);
    for (let i = 0; i < maxTitles; i++) {
      const columnIndex = sheetAnalysis.titleColumns[i];
      
      if (!this.isColumnProtected(columnIndex)) {
        updatedRow[columnIndex] = content.titles[i];
      }
    }

    // Fill description columns (avoiding protected columns)
    const maxDescriptions = Math.min(content.descriptions.length, sheetAnalysis.descriptionColumns.length);
    for (let i = 0; i < maxDescriptions; i++) {
      const columnIndex = sheetAnalysis.descriptionColumns[i];
      
      if (!this.isColumnProtected(columnIndex)) {
        updatedRow[columnIndex] = content.descriptions[i];
      }
    }

    updatedSheetData[rowIndex] = updatedRow;

    this.logger.debug('Sheet updated with content', {
      titlesAdded: maxTitles,
      descriptionsAdded: maxDescriptions,
      rowLength: updatedRow.length
    });

    return updatedSheetData;
  }

  // ==================== SHEET EXTENSION ====================

  private static extendSheetStructure(sheetData: string[][], analysis: any): void {
    const headers = sheetData[0];
    
    // Add missing title columns
    const missingTitles = LIMITS.REQUIRED_TITLES_COUNT - analysis.titleColumns.length;
    if (missingTitles > 0) {
      for (let i = 0; i < missingTitles; i++) {
        const titleNumber = analysis.titleColumns.length + i + 1;
        headers.push(`Titre ${titleNumber}`);
        analysis.titleColumns.push(headers.length - 1);
      }
    }

    // Add missing description columns
    const missingDescriptions = LIMITS.REQUIRED_DESCRIPTIONS_COUNT - analysis.descriptionColumns.length;
    if (missingDescriptions > 0) {
      for (let i = 0; i < missingDescriptions; i++) {
        const descNumber = analysis.descriptionColumns.length + i + 1;
        headers.push(`Description ${descNumber}`);
        analysis.descriptionColumns.push(headers.length - 1);
      }
    }

    this.logger.info('Sheet structure extended', {
      addedTitles: Math.max(0, missingTitles),
      addedDescriptions: Math.max(0, missingDescriptions),
      totalColumns: headers.length
    });
  }

  // ==================== COLUMN PROTECTION ====================

  private static isColumnProtected(columnIndex: number): boolean {
    // Convert to Excel column letter (A=0, B=1, etc.)
    let result = '';
    let num = columnIndex;
    
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }

    return PROTECTED_COLUMNS.includes(columnIndex as any);
  }

  // ==================== PUBLIC UTILITIES ====================

  static getCacheStats() {
    return this.promptEngine.getCacheStats();
  }

  static clearCache(): void {
    this.promptEngine.clearCache();
  }

  static getIndustryConfig(industry?: string) {
    return this.promptEngine.getIndustryConfig(industry);
  }

  static getSupportedIndustries(): string[] {
    return this.promptEngine.getSupportedIndustries();
  }
}