
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

export interface GenerationHistory {
  id: string;
  userId: string;
  sheetId: string;
  campaignName: string;
  adGroupName: string;
  generatedContent: {
    titles: string[];
    descriptions: string[];
  };
  provider: string;
  model: string;
  promptData?: any;
  tokensUsed?: number;
  validationResults?: any;
  timestamp: Date;
}

export interface GenerationBackup {
  id: string;
  previousContent: any[][];
  timestamp: Date;
  canRevert: boolean;
}

class ContentHistoryService {
  private readonly CACHE_KEY = 'content_history_cache';
  private cache: Map<string, GenerationHistory[]> = new Map();

  async saveGeneration(data: Omit<GenerationHistory, 'id' | 'userId' | 'timestamp'>): Promise<string | null> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { data: result, error } = await supabase
        .from('content_generations')
        .insert({
          user_id: userId,
          sheet_id: data.sheetId,
          campaign_name: data.campaignName,
          ad_group_name: data.adGroupName,
          generated_content: data.generatedContent,
          provider: data.provider,
          model: data.model,
          prompt_data: data.promptData,
          tokens_used: data.tokensUsed,
          validation_results: data.validationResults
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving generation:', error);
        return null;
      }

      // Invalider le cache
      this.cache.delete(data.sheetId);
      
      return result.id;
    } catch (error) {
      console.error('Exception saving generation:', error);
      return null;
    }
  }

  async getHistoryForSheet(sheetId: string): Promise<GenerationHistory[]> {
    // Vérifier le cache d'abord
    if (this.cache.has(sheetId)) {
      return this.cache.get(sheetId)!;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('content_generations')
        .select('*')
        .eq('user_id', userId)
        .eq('sheet_id', sheetId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      const history = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        sheetId: item.sheet_id,
        campaignName: item.campaign_name,
        adGroupName: item.ad_group_name,
        generatedContent: item.generated_content as any,
        provider: item.provider,
        model: item.model,
        promptData: item.prompt_data,
        tokensUsed: item.tokens_used,
        validationResults: item.validation_results,
        timestamp: new Date(item.created_at)
      }));

      // Mettre en cache
      this.cache.set(sheetId, history);
      
      return history;
    } catch (error) {
      console.error('Exception fetching history:', error);
      return [];
    }
  }

  async deleteGeneration(id: string): Promise<boolean> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('content_generations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (!error) {
        // Invalider tout le cache
        this.cache.clear();
      }

      return !error;
    } catch (error) {
      console.error('Exception deleting generation:', error);
      return false;
    }
  }

  // Méthode pour nettoyer le cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const contentHistoryService = new ContentHistoryService();
