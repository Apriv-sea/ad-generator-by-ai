
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorState {
  error: Error | null;
  isError: boolean;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false
  });

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    
    console.error(`Erreur${context ? ` dans ${context}` : ''}:`, errorObj);
    
    setErrorState({
      error: errorObj,
      isError: true
    });

    // Afficher un toast d'erreur user-friendly
    const message = errorObj.message || 'Une erreur inattendue s\'est produite';
    toast.error(context ? `${context}: ${message}` : message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false
    });
  }, []);

  const withErrorHandling = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      asyncFn: T,
      context?: string
    ): T => {
      return (async (...args: any[]) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          handleError(error as Error, context);
          throw error;
        }
      }) as T;
    },
    [handleError]
  );

  return {
    error: errorState.error,
    isError: errorState.isError,
    handleError,
    clearError,
    withErrorHandling
  };
};
