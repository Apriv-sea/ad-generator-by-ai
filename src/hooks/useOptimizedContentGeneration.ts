// Hook React optimisé - Utilise les nouvelles performances
// Traitement par lot + cache + throttling automatique

import { useCallback, useState } from 'react';
import { DebugContentGeneration } from '@/services/content/DebugContentGeneration';
import { useThrottledCallback } from '@/services/core/ClickThrottler';
import { Logger } from '@/services/core/Logger';
import { Client, Sheet } from '@/types/unified';
import { toast } from 'sonner';

interface ContentGenerationHookResult {
  generateContent: () => Promise<void>;
  generateBatch: (selectedRows: number[]) => Promise<void>;
  isSaving: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  cacheStats: any;
  clearCache: () => void;
}

interface UseOptimizedContentGenerationProps {
  sheet: Sheet;
  clientInfo: Client | null;
  sheetData: any[][] | null;
  setSheetData: React.Dispatch<React.SetStateAction<any[][] | null>>;
  onUpdateComplete: () => void;
}

export function useOptimizedContentGeneration({
  sheet,
  clientInfo,
  sheetData,
  setSheetData,
  onUpdateComplete
}: UseOptimizedContentGenerationProps): ContentGenerationHookResult {
  
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai:gpt-4o-mini');
  const [cacheStats, setCacheStats] = useState<any>({});
  const logger = new Logger('useOptimizedContentGeneration');

  // ==================== GÉNÉRATION SIMPLE (LEGACY) ====================

  const generateContentThrottled = useThrottledCallback(
    async () => {
      if (!sheetData || !clientInfo) {
        toast.error('Données manquantes pour la génération');
        return;
      }

      setIsSaving(true);
      try {
        logger.info('Starting single generation', { sheet: sheet.id });

        // Construire le contexte client
        const clientContext = buildClientContext(clientInfo);
        const headers = sheetData[0];
        const dataRows = sheetData.slice(1);
        let updatedRows = [...dataRows];
        let contentGeneratedCount = 0;

        // Traiter chaque ligne (séquentiel - legacy)
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!isRowValid(row)) {
            logger.debug(`Row ${i + 1} skipped - invalid data`);
            continue;
          }

          const { campaign, adGroup, keywords } = extractRowData(row);
          
          const result = await DebugContentGeneration.generateAndSaveContent(
            {
              model: selectedModel,
              clientContext,
              industry: clientInfo.industry,
              targetPersona: clientInfo.targetPersona,
              campaignContext: campaign,
              adGroupContext: adGroup,
              keywords: keywords.slice(0, 3)
            },
            sheet.id,
            i + 1, // +1 car on compte les headers
            [headers, ...updatedRows]
          );

          if (result.success && result.updatedSheetData) {
            updatedRows = result.updatedSheetData.slice(1); // Enlever les headers
            contentGeneratedCount++;
          } else {
            logger.error(`Generation failed for row ${i + 1}`, { error: result.error });
          }
        }

        // Mettre à jour l'état
        setSheetData([headers, ...updatedRows]);
        onUpdateComplete();
        
        // Mettre à jour les stats du cache
        updateCacheStats();

        toast.success(`Contenu généré avec succès pour ${contentGeneratedCount} ligne(s)`);

      } catch (error) {
        logger.error('Generation failed', { error: error.message });
        toast.error(`Erreur: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    },
    `generate_${sheet.id}_${clientInfo?.id}`,
    3000 // 3 secondes de throttling
  );

  // ==================== GÉNÉRATION PAR LOT (NOUVEAU) ====================

  const generateBatchThrottled = useThrottledCallback(
    async (selectedRows: number[]) => {
      if (!sheetData || !clientInfo || selectedRows.length === 0) {
        toast.error('Sélectionnez au moins une ligne à traiter');
        return;
      }

      setIsSaving(true);
      
      try {
        logger.info('Starting batch generation', { 
          sheet: sheet.id, 
          rowCount: selectedRows.length 
        });

        const clientContext = buildClientContext(clientInfo);
        const headers = sheetData[0];
        const dataRows = sheetData.slice(1);

        // Préparer les jobs pour le traitement par lot
        const jobs = selectedRows
          .filter(rowIndex => isRowValid(dataRows[rowIndex]))
          .map(rowIndex => {
            const row = dataRows[rowIndex];
            const { campaign, adGroup, keywords } = extractRowData(row);

            return {
              rowIndex: rowIndex + 1, // +1 pour compter les headers
              options: {
                model: selectedModel,
                clientContext,
                industry: clientInfo.industry,
                targetPersona: clientInfo.targetPersona,
                campaignContext: campaign,
                adGroupContext: adGroup,
                keywords: keywords.slice(0, 3)
              }
            };
          });

        if (jobs.length === 0) {
          toast.error('Aucune ligne valide à traiter');
          return;
        }

        // Traitement par lot avec callback de progression
        const result = await DebugContentGeneration.generateContentForMultipleRows(
          jobs,
          sheet.id,
          sheetData,
          (completed, total) => {
            // On pourrait afficher la progression ici si nécessaire
            logger.debug('Batch progress', { completed, total });
          }
        );

        if (result.success) {
          // Récupérer la dernière version des données mises à jour
          const lastSuccessfulResult = result.results
            .filter(r => r.success)
            .pop();

          if (lastSuccessfulResult?.updatedSheetData) {
            setSheetData(lastSuccessfulResult.updatedSheetData);
          }

          onUpdateComplete();
          updateCacheStats();

          const successCount = result.results.filter(r => r.success).length;
          const failCount = result.results.filter(r => !r.success).length;
          
          let message = `✅ ${successCount} ligne(s) traitée(s) avec succès`;
          if (result.cacheHits > 0) {
            message += ` (${result.cacheHits} résultat(s) du cache)`;
          }
          if (failCount > 0) {
            message += `, ❌ ${failCount} échec(s)`;
          }

          toast.success(message);

        } else {
          toast.error('Échec du traitement par lot');
        }

      } catch (error) {
        logger.error('Batch generation failed', { error: error.message });
        toast.error(`Erreur: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    },
    `batch_${sheet.id}_${clientInfo?.id}`,
    2000 // 2 secondes de throttling pour les lots
  );

  // ==================== UTILITAIRES ====================

  const buildClientContext = useCallback((client: Client): string => {
    return [
      client.businessContext,
      client.specifics ? `Spécificités: ${client.specifics}` : '',
      client.editorialGuidelines ? `Style: ${client.editorialGuidelines}` : ''
    ].filter(Boolean).join(' ');
  }, []);

  const isRowValid = useCallback((row: any[]): boolean => {
    return row && row[0] && row[1] && row[2];
  }, []);

  const extractRowData = useCallback((row: any[]) => {
    return {
      campaign: row[0],
      adGroup: row[1], 
      keywords: row[2].split(',').map((k: string) => k.trim()).filter((k: string) => k)
    };
  }, []);

  const updateCacheStats = useCallback(() => {
    try {
      const stats = DebugContentGeneration.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      logger.warn('Failed to update cache stats', { error: error.message });
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      DebugContentGeneration.clearCache();
      updateCacheStats();
      toast.success('Cache effacé');
    } catch (error) {
      logger.error('Failed to clear cache', { error: error.message });
      toast.error('Erreur lors de l\'effacement du cache');
    }
  }, [updateCacheStats]);

  // Mettre à jour les stats au chargement
  useState(() => {
    updateCacheStats();
  });

  return {
    generateContent: generateContentThrottled,
    generateBatch: generateBatchThrottled,
    isSaving,
    selectedModel,
    setSelectedModel,
    cacheStats,
    clearCache
  };
}