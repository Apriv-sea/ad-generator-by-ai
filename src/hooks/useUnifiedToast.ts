// Hook pour le système de Toast unifié avec retry actions
import { toast } from "sonner";
import { useCallback } from "react";

export interface ToastAction {
  label: string;
  action: () => void;
}

export interface UnifiedToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  retryAction?: () => void;
  customAction?: ToastAction;
}

export const useUnifiedToast = () => {

  const showToast = useCallback((options: UnifiedToastOptions) => {
    const { title, description, variant = 'default', duration, retryAction, customAction } = options;

    if (variant === 'destructive') {
      toast.error(title, {
        description,
        duration,
        action: retryAction ? {
          label: "Réessayer",
          onClick: retryAction,
        } : customAction ? {
          label: customAction.label,
          onClick: customAction.action,
        } : undefined,
      });
    } else {
      toast.success(title, {
        description,
        duration,
        action: customAction ? {
          label: customAction.label,
          onClick: customAction.action,
        } : undefined,
      });
    }
  }, []);

  // Méthodes pré-configurées pour les cas courants
  const success = useCallback((title: string, description?: string, customAction?: ToastAction) => {
    showToast({
      title,
      description,
      variant: 'default',
      customAction,
    });
  }, [showToast]);

  const error = useCallback((title: string, description?: string, retryAction?: () => void) => {
    showToast({
      title,
      description,
      variant: 'destructive',
      retryAction,
    });
  }, [showToast]);

  const info = useCallback((title: string, description?: string, customAction?: ToastAction) => {
    toast(title, {
      description,
      duration: 3000,
      action: customAction ? {
        label: customAction.label,
        onClick: customAction.action,
      } : undefined,
    });
  }, []);

  const loading = useCallback((title: string, description?: string) => {
    toast.loading(title, {
      description,
    });
  }, []);

  return {
    showToast,
    success,
    error,
    info,
    loading,
  };
};