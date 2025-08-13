/**
 * Enhanced Authentication Service with Security Features
 */

import { supabase } from '@/integrations/supabase/client';
import { SecurityMonitoringService } from './securityMonitoringService';

export class EnhancedAuthService {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Secure login with rate limiting and monitoring
   */
  static async secureLogin(email: string, password: string, userAgent?: string): Promise<void> {
    try {
      // Check for rate limiting
      const isRateLimited = await this.checkRateLimit(email);
      if (isRateLimited) {
        await SecurityMonitoringService.logAuthEvent('failed_login', { 
          email, 
          reason: 'rate_limited',
          user_agent: userAgent 
        });
        throw new Error('Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.');
      }

      // Attempt login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed attempt
        await this.recordFailedAttempt(email);
        await SecurityMonitoringService.logAuthEvent('failed_login', { 
          email, 
          error: error.message,
          user_agent: userAgent 
        });
        throw error;
      }

      // Clear failed attempts on successful login
      await this.clearFailedAttempts(email);
      await SecurityMonitoringService.logAuthEvent('login', { 
        email,
        user_agent: userAgent 
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Secure signup with enhanced validation
   */
  static async secureSignup(email: string, password: string, userAgent?: string): Promise<void> {
    try {
      // Validate password strength
      if (!this.validatePasswordStrength(password)) {
        throw new Error('Le mot de passe ne respecte pas les critères de sécurité requis');
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            signup_timestamp: new Date().toISOString(),
            signup_origin: window.location.origin,
            user_agent: userAgent
          }
        }
      });

      if (error) {
        await SecurityMonitoringService.logAuthEvent('failed_signup', { 
          email, 
          error: error.message,
          user_agent: userAgent 
        });
        throw error;
      }

      await SecurityMonitoringService.logAuthEvent('signup', { 
        email,
        user_agent: userAgent 
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Secure logout with cleanup
   */
  static async secureLogout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear sensitive data
      localStorage.removeItem('auth_connected');
      localStorage.removeItem('user_data');
      sessionStorage.clear();

      await SecurityMonitoringService.logAuthEvent('logout');

    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate password strength
   */
  private static validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[@$!%*?&]/.test(password);

    return password.length >= minLength && 
           hasUppercase && 
           hasLowercase && 
           hasNumbers && 
           hasSpecialChars;
  }

  /**
   * Check if user is rate limited
   */
  private static async checkRateLimit(email: string): Promise<boolean> {
    const attempts = localStorage.getItem(`login_attempts_${email}`);
    if (!attempts) return false;

    const { count, lastAttempt } = JSON.parse(attempts);
    const now = Date.now();

    if (count >= this.MAX_LOGIN_ATTEMPTS) {
      if (now - lastAttempt < this.LOCKOUT_DURATION) {
        return true;
      } else {
        // Reset after lockout period
        localStorage.removeItem(`login_attempts_${email}`);
      }
    }

    return false;
  }

  /**
   * Record failed login attempt
   */
  private static async recordFailedAttempt(email: string): Promise<void> {
    const key = `login_attempts_${email}`;
    const existing = localStorage.getItem(key);
    const now = Date.now();

    if (existing) {
      const { count } = JSON.parse(existing);
      localStorage.setItem(key, JSON.stringify({
        count: count + 1,
        lastAttempt: now
      }));
    } else {
      localStorage.setItem(key, JSON.stringify({
        count: 1,
        lastAttempt: now
      }));
    }
  }

  /**
   * Clear failed attempts on successful login
   */
  private static async clearFailedAttempts(email: string): Promise<void> {
    localStorage.removeItem(`login_attempts_${email}`);
  }
}