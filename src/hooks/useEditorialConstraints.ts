import { useState, useEffect, useCallback } from 'react';
import { EditorialConstraints, EditorialConstraintsService, ConstraintValidationResult } from '@/services/content/editorialConstraintsService';
import { toast } from '@/hooks/use-toast';

interface UseEditorialConstraintsProps {
  clientId?: string;
  industry?: string;
  editorialGuidelines?: string;
  initialConstraints?: Partial<EditorialConstraints>;
}

interface UseEditorialConstraintsReturn {
  constraints: EditorialConstraints;
  setConstraints: (constraints: EditorialConstraints) => void;
  validation: ConstraintValidationResult | null;
  isLoading: boolean;
  isDirty: boolean;
  saveConstraints: () => Promise<void>;
  resetConstraints: () => void;
  validateContent: (content: string) => {
    isValid: boolean;
    violations: string[];
    score: number;
  };
  generatePromptSection: () => string;
  exportConstraints: () => void;
  importConstraints: (file: File) => Promise<void>;
}

export const useEditorialConstraints = ({
  clientId,
  industry,
  editorialGuidelines,
  initialConstraints
}: UseEditorialConstraintsProps = {}): UseEditorialConstraintsReturn => {
  const [constraints, setConstraints] = useState<EditorialConstraints>({
    forbiddenTerms: [],
    forbiddenPhrases: [],
    forbiddenTones: [],
    mandatoryTerms: [],
    constraintPriority: 'high',
    ...initialConstraints
  });

  const [validation, setValidation] = useState<ConstraintValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [originalConstraints, setOriginalConstraints] = useState<EditorialConstraints | null>(null);

  const constraintsService = EditorialConstraintsService.getInstance();

  // Initialize original constraints for dirty tracking
  useEffect(() => {
    if (!originalConstraints && initialConstraints) {
      const fullConstraints = {
        forbiddenTerms: [],
        forbiddenPhrases: [],
        forbiddenTones: [],
        mandatoryTerms: [],
        constraintPriority: 'high' as const,
        ...initialConstraints
      };
      setOriginalConstraints(fullConstraints);
      setConstraints(fullConstraints);
    }
  }, [initialConstraints]);

  // Track dirty state
  useEffect(() => {
    if (originalConstraints) {
      const hasChanged = JSON.stringify(constraints) !== JSON.stringify(originalConstraints);
      setIsDirty(hasChanged);
    }
  }, [constraints, originalConstraints]);

  // Auto-parse editorial guidelines
  useEffect(() => {
    if (editorialGuidelines && constraints.forbiddenTerms.length === 0) {
      const parsed = constraintsService.parseEditorialGuidelines(editorialGuidelines);
      if (parsed.forbiddenTerms?.length || parsed.forbiddenPhrases?.length) {
        setConstraints(prev => ({
          ...prev,
          forbiddenTerms: [...prev.forbiddenTerms, ...(parsed.forbiddenTerms || [])],
          forbiddenPhrases: [...prev.forbiddenPhrases, ...(parsed.forbiddenPhrases || [])],
          forbiddenTones: [...prev.forbiddenTones, ...(parsed.forbiddenTones || [])],
          mandatoryTerms: [...prev.mandatoryTerms, ...(parsed.mandatoryTerms || [])],
        }));
      }
    }
  }, [editorialGuidelines]);

  // Validate constraints when they change
  useEffect(() => {
    if (industry) {
      // In a real app, this would fetch actual industry config
      const mockIndustryConfig = { 
        keywords: [], 
        tone: 'professionnel',
        restrictions: []
      };
      
      const validationResult = constraintsService.validateConstraints(
        constraints, 
        mockIndustryConfig, 
        ''
      );
      setValidation(validationResult);
    }
  }, [constraints, industry]);

  const saveConstraints = useCallback(async () => {
    if (!clientId) {
      toast({
        title: "Erreur",
        description: "ID client manquant pour sauvegarder",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Here you would save to your backend/database
      // For now, we'll simulate with localStorage
      localStorage.setItem(`constraints_${clientId}`, JSON.stringify(constraints));
      
      setOriginalConstraints({ ...constraints });
      setIsDirty(false);
      
      toast({
        title: "Contraintes sauvegardées",
        description: "Les contraintes éditoriales ont été mises à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les contraintes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, constraints]);

  const resetConstraints = useCallback(() => {
    if (originalConstraints) {
      setConstraints({ ...originalConstraints });
      setIsDirty(false);
    }
  }, [originalConstraints]);

  const validateContent = useCallback((content: string) => {
    return constraintsService.validateGeneratedContent(content, constraints);
  }, [constraints]);

  const generatePromptSection = useCallback(() => {
    return constraintsService.generateConstraintPromptSection(constraints);
  }, [constraints]);

  const exportConstraints = useCallback(() => {
    const exported = constraintsService.exportConstraints(constraints);
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contraintes-${clientId || 'client'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [constraints, clientId]);

  const importConstraints = useCallback(async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = constraintsService.importConstraints(content);
          if (imported) {
            setConstraints(imported);
            toast({
              title: "Import réussi",
              description: "Contraintes importées avec succès"
            });
            resolve();
          } else {
            reject(new Error('Import failed'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }, []);

  return {
    constraints,
    setConstraints,
    validation,
    isLoading,
    isDirty,
    saveConstraints,
    resetConstraints,
    validateContent,
    generatePromptSection,
    exportConstraints,
    importConstraints
  };
};