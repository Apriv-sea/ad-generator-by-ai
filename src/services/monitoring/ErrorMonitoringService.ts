// Service de monitoring des erreurs en temps réel
interface ErrorLog {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    action?: string;
    component?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorMonitoringService {
  private errorQueue: ErrorLog[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Écouter les erreurs globales non catchées
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        name: event.error?.name || 'UnhandledError',
      }, {
        action: 'global_error',
        component: 'window',
      }, 'high');
    });

    // Écouter les rejections de promesses non catchées
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        name: 'UnhandledPromiseRejection',
      }, {
        action: 'promise_rejection',
        component: 'promise',
      }, 'high');
    });
  }

  logError(
    error: { message: string; stack?: string; name: string },
    context: { action?: string; component?: string; userId?: string } = {},
    severity: ErrorLog['severity'] = 'medium'
  ) {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
      severity,
    };

    this.errorQueue.push(errorLog);

    // Log local pour debugging
    console.error('Error logged:', errorLog);

    // Essayer d'envoyer immédiatement si en ligne
    if (this.isOnline) {
      this.flushErrorQueue();
    }

    // Si critique, essayer de forcer l'envoi
    if (severity === 'critical') {
      this.forceSendError(errorLog);
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    try {
      // Ici on pourrait envoyer à un service de monitoring externe
      // Pour l'instant, on stocke en localStorage comme backup
      const existingErrors = this.getStoredErrors();
      const allErrors = [...existingErrors, ...this.errorQueue];
      
      localStorage.setItem('error_logs', JSON.stringify(allErrors.slice(-100))); // Garder seulement les 100 dernières
      
      // Vider la queue après envoi réussi
      this.errorQueue = [];
      
    } catch (error) {
      console.error('Failed to flush error queue:', error);
    }
  }

  private async forceSendError(errorLog: ErrorLog) {
    try {
      // Pour les erreurs critiques, on pourrait utiliser navigator.sendBeacon
      // ou fetch avec keepalive
      const payload = JSON.stringify(errorLog);
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/errors', payload);
      }
    } catch (error) {
      console.error('Failed to send critical error:', error);
    }
  }

  private getStoredErrors(): ErrorLog[] {
    try {
      const stored = localStorage.getItem('error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Méthode pour récupérer les stats d'erreurs
  getErrorStats(timeRange: 'hour' | 'day' | 'week' = 'day') {
    const errors = this.getStoredErrors();
    const now = new Date();
    const cutoff = new Date();

    switch (timeRange) {
      case 'hour':
        cutoff.setHours(now.getHours() - 1);
        break;
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
    }

    const recentErrors = errors.filter(error => 
      new Date(error.timestamp) > cutoff
    );

    return {
      total: recentErrors.length,
      bySeverity: {
        low: recentErrors.filter(e => e.severity === 'low').length,
        medium: recentErrors.filter(e => e.severity === 'medium').length,
        high: recentErrors.filter(e => e.severity === 'high').length,
        critical: recentErrors.filter(e => e.severity === 'critical').length,
      },
      byComponent: recentErrors.reduce((acc, error) => {
        const component = error.context.component || 'unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Méthode pour nettoyer les anciennes erreurs
  cleanupOldErrors(daysToKeep = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const errors = this.getStoredErrors();
    const recentErrors = errors.filter(error => 
      new Date(error.timestamp) > cutoff
    );

    localStorage.setItem('error_logs', JSON.stringify(recentErrors));
  }
}

export const errorMonitoringService = new ErrorMonitoringService();
