import { supabase } from '@/integrations/supabase/client';

export interface SessionData {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export class SessionSecurityService {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  /**
   * Create a new secure session
   */
  static async createSession(): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.user.id,
          session_token: sessionToken,
          ip_address: await this.getCurrentIP(),
          user_agent: navigator.userAgent,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      return sessionToken;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  static async updateActivity(sessionToken?: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (sessionToken) {
        await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            expires_at: new Date(Date.now() + this.SESSION_TIMEOUT).toISOString()
          })
          .eq('session_token', sessionToken)
          .eq('user_id', user.user.id);
      }
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Validate session
   */
  static async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !session) return false;

      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      const lastActivity = new Date(session.last_activity);

      // Check if session has expired
      if (now > expiresAt) {
        await this.invalidateSession(sessionToken);
        return false;
      }

      // Check if session has been inactive too long
      if (now.getTime() - lastActivity.getTime() > this.ACTIVITY_TIMEOUT) {
        await this.invalidateSession(sessionToken);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate session:', error);
      return false;
    }
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Invalidate all user sessions
   */
  static async invalidateAllUserSessions(): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.user.id);
    } catch (error) {
      console.error('Failed to invalidate all user sessions:', error);
    }
  }

  /**
   * Get current IP address (simplified)
   */
  private static async getCurrentIP(): Promise<string | null> {
    try {
      // In a real implementation, you might use a service to get the IP
      // For now, we'll return null and let the database handle it
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Detect suspicious activity
   */
  static async detectSuspiciousActivity(sessionToken: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      // Check for multiple sessions from different IPs
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('ip_address, user_agent')
        .eq('user_id', user.user.id)
        .eq('is_active', true);

      if (error || !sessions) return false;

      // Simple heuristic: flag if more than 3 active sessions
      if (sessions.length > 3) {
        console.warn('Suspicious activity detected: Multiple active sessions');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      return false;
    }
  }

  /**
   * Cleanup expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }
}