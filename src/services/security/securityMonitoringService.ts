import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  user_id?: string;
  details?: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high';
  page_url?: string;
  user_agent?: string;
}

export class SecurityMonitoringService {
  /**
   * Log a security event
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('user_analytics').insert({
        user_id: event.user_id || user?.id,
        event_type: `security:${event.event_type}`,
        event_data: {
          ...event.details,
          risk_level: event.risk_level,
          timestamp: new Date().toISOString()
        },
        page_url: event.page_url || window.location.href,
        user_agent: event.user_agent || navigator.userAgent,
        session_id: this.getSessionId()
      });

      // Log critical events to console for immediate visibility
      if (event.risk_level === 'high') {
        console.warn('🚨 High-risk security event:', event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log authentication attempts
   */
  static async logAuthEvent(eventType: 'login' | 'logout' | 'signup' | 'failed_login' | 'failed_signup', details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: `auth_${eventType}`,
      details,
      risk_level: (eventType === 'failed_login' || eventType === 'failed_signup') ? 'medium' : 'low'
    });
  }

  /**
   * Log API key operations
   */
  static async logApiKeyEvent(eventType: 'created' | 'updated' | 'deleted' | 'validation_failed', service: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: `api_key_${eventType}`,
      details: { service },
      risk_level: eventType === 'validation_failed' ? 'medium' : 'low'
    });
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(activity: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'suspicious_activity',
      details: { activity, ...details },
      risk_level: 'high'
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccess(resourceType: string, action: string, resourceId?: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'data_access',
      details: { resourceType, action, resourceId },
      risk_level: 'low'
    });
  }

  /**
   * Get or create session ID
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Monitor for suspicious patterns
   */
  static async checkForSuspiciousPatterns(userId: string): Promise<boolean> {
    try {
      const { data: recentEvents } = await supabase
        .from('user_analytics')
        .select('event_type, created_at, event_data')
        .eq('user_id', userId)
        .like('event_type', 'security:%')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!recentEvents) return false;

      // Check for high frequency of failed attempts
      const failedAttempts = recentEvents.filter(event => 
        event.event_type.includes('failed') || 
        (event.event_data as any)?.risk_level === 'high'
      );

      if (failedAttempts.length > 5) {
        await this.logSuspiciousActivity('multiple_failed_attempts', {
          count: failedAttempts.length,
          timeWindow: '24h'
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking suspicious patterns:', error);
      return false;
    }
  }
}