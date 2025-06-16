
// Security headers service for enhanced protection
export class SecurityHeadersService {
  
  // Content Security Policy configuration
  static getCSPHeaders(): Record<string, string> {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://apis.google.com https://sheets.googleapis.com",
      "frame-src 'self' https://accounts.google.com https://docs.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');

    return {
      'Content-Security-Policy': csp,
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }

  // Apply security headers to fetch requests
  static enhanceRequest(init: RequestInit = {}): RequestInit {
    const securityHeaders = {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };

    return {
      ...init,
      headers: {
        ...securityHeaders,
        ...init.headers
      }
    };
  }

  // Validate response headers for security
  static validateResponse(response: Response): boolean {
    const contentType = response.headers.get('content-type');
    
    // Ensure JSON responses have correct content type
    if (contentType && !contentType.includes('application/json') && 
        response.url.includes('/api/')) {
      console.warn('Unexpected content type for API response:', contentType);
      return false;
    }

    return true;
  }
}
