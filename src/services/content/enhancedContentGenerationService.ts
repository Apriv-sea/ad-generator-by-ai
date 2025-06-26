
import { contentHistoryService, GenerationHistory, GenerationBackup } from "../history/contentHistoryService";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

class EnhancedContentGenerationService {
  private backupStorage: Map<string, GenerationBackup[]> = new Map();
  private compressionEnabled = true;

  async generateContentWithHistory(
    sheetId: string,
    campaignName: string,
    adGroupName: string,
    generationData: any,
    provider: string,
    model: string
  ): Promise<any> {
    try {
      // Créer une sauvegarde avant la génération
      await this.createBackup(sheetId, generationData.currentContent || []);

      // Appeler le service de génération existant
      const { data, error } = await supabase.functions.invoke('llm-generation', {
        body: {
          ...generationData,
          provider,
          model
        }
      });

      if (error) throw error;

      // Sauvegarder dans l'historique
      await contentHistoryService.saveGeneration({
        sheetId,
        campaignName,
        adGroupName,
        generatedContent: data.content,
        provider,
        model,
        promptData: generationData,
        tokensUsed: data.tokensUsed,
        validationResults: data.validation
      });

      return data;
    } catch (error) {
      console.error('Error in enhanced content generation:', error);
      throw error;
    }
  }

  async createBackup(sheetId: string, content: any[][]): Promise<string> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Compression des données si activée
      const backupData = this.compressionEnabled ? 
        this.compressData(content) : content;

      const { data, error } = await supabase.functions.invoke('create_automatic_backup', {
        body: {
          backup_type: 'sheet_data',
          data_reference: sheetId,
          backup_data: backupData
        }
      });

      if (error) throw error;

      // Ajouter au cache local
      const backup: GenerationBackup = {
        id: data.id,
        previousContent: content,
        timestamp: new Date(),
        canRevert: true
      };

      const existingBackups = this.backupStorage.get(sheetId) || [];
      existingBackups.unshift(backup);
      
      // Garder seulement les 10 dernières sauvegardes en mémoire
      if (existingBackups.length > 10) {
        existingBackups.splice(10);
      }
      
      this.backupStorage.set(sheetId, existingBackups);

      return data.id;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async revertToBackup(backupId: string): Promise<any[][] | null> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('data_backups')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.error('Backup not found:', error);
        return null;
      }

      // Décompresser les données si nécessaire
      const restoredData = this.compressionEnabled ? 
        this.decompressData(data.backup_data) : data.backup_data;

      // Marquer comme utilisé dans le cache local
      for (const [sheetId, backups] of this.backupStorage.entries()) {
        const backup = backups.find(b => b.id === backupId);
        if (backup) {
          backup.canRevert = false;
          break;
        }
      }

      return restoredData;
    } catch (error) {
      console.error('Error reverting backup:', error);
      return null;
    }
  }

  getHistoryForSheet(sheetId: string): GenerationHistory[] {
    return contentHistoryService.getHistoryForSheet(sheetId) as any;
  }

  getBackupsForSheet(sheetId: string): GenerationBackup[] {
    return this.backupStorage.get(sheetId) || [];
  }

  getStatsForSheet(sheetId: string): any {
    const history = this.getHistoryForSheet(sheetId);
    const backups = this.getBackupsForSheet(sheetId);

    const providersUsed = history.reduce((acc, item) => {
      acc[item.provider] = (acc[item.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalTokens = history.reduce((sum, item) => sum + (item.tokensUsed || 0), 0);

    return {
      totalGenerations: history.length,
      totalBackups: backups.length,
      averageTokensUsed: history.length > 0 ? Math.round(totalTokens / history.length) : 0,
      providersUsed
    };
  }

  private compressData(data: any): any {
    // Implémentation simple de compression - peut être améliorée
    try {
      const jsonString = JSON.stringify(data);
      // Simuler une compression simple en supprimant les espaces
      return {
        compressed: true,
        data: jsonString.replace(/\s+/g, ' ').trim(),
        originalSize: jsonString.length
      };
    } catch {
      return data;
    }
  }

  private decompressData(compressedData: any): any {
    if (compressedData?.compressed) {
      try {
        return JSON.parse(compressedData.data);
      } catch {
        return compressedData.data;
      }
    }
    return compressedData;
  }
}

export const enhancedContentGenerationService = new EnhancedContentGenerationService();
