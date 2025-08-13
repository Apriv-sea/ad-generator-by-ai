import { useState, useEffect } from 'react';
import { IndustryAnalysisService, type IndustryAnalysisResult } from '@/services/ai/industryAnalysisService';

interface UseIndustryAnalysisOptions {
  autoAnalyze?: boolean;
  minContextLength?: number;
}

export const useIndustryAnalysis = (
  businessContext: string,
  clientName?: string,
  options: UseIndustryAnalysisOptions = {}
) => {
  const { autoAnalyze = true, minContextLength = 20 } = options;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<IndustryAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-analyse quand le contexte change
  useEffect(() => {
    if (autoAnalyze && businessContext.length >= minContextLength) {
      analyzeIndustry();
    }
  }, [businessContext, autoAnalyze, minContextLength]);

  const analyzeIndustry = async () => {
    if (!businessContext || businessContext.length < minContextLength) {
      setError(`Contexte trop court (minimum ${minContextLength} caractères)`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResult = await IndustryAnalysisService.analyzeIndustry(
        businessContext,
        clientName
      );
      
      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
      setError(errorMessage);
      console.error('Erreur analyse secteur:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return {
    isAnalyzing,
    result,
    error,
    analyzeIndustry,
    reset,
    hasResult: !!result,
    isHighConfidence: result ? result.confidence > 70 : false
  };
};