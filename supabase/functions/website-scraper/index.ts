import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Security validation for URLs
function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    // Block private IP ranges and localhost
    const hostname = urlObj.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.match(/^10\./) ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) ||
      hostname.match(/^192\.168\./)
    ) {
      return { isValid: false, error: 'Private IP addresses and localhost are not allowed' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
    .substring(0, 1000); // Limit input length
}

Deno.serve(async (req) => {
  console.log('🌐 Website Scraper called:', req.method, req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = req.headers.get('authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      console.warn('⚠️ Rate limit exceeded for user:', user.id)
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 10 requests per hour.' }), 
        { status: 429, headers: corsHeaders }
      )
    }

    const { url } = await req.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }), 
        { status: 400, headers: corsHeaders }
      )
    }

    // Sanitize and validate URL
    const sanitizedUrl = sanitizeInput(url);
    const urlValidation = validateUrl(sanitizedUrl);
    
    if (!urlValidation.isValid) {
      console.warn('⚠️ Invalid URL provided:', sanitizedUrl, urlValidation.error)
      return new Response(
        JSON.stringify({ error: urlValidation.error }), 
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('🔍 Scraping website:', sanitizedUrl)

    // Log security event
    console.log('🔒 Security event: URL scraping request', {
      userId: user.id,
      url: sanitizedUrl,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent')
    })

    // Simple web scraping using fetch (fallback if Firecrawl is not available)
    try {
      const response = await fetch(sanitizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()
      
      // Extract basic content from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1] : ''
      
      // Extract meta description
      const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
      const metaDescription = metaDescMatch ? metaDescMatch[1] : ''
      
      // Extract text content (simple approach)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000) // Limit content size
      
      const scrapedData = {
        url,
        title,
        metaDescription,
        content: textContent,
        timestamp: new Date().toISOString()
      }

      console.log('✅ Website scraping completed successfully')
      console.log(`📊 Content length: ${textContent.length} characters`)

      return new Response(JSON.stringify(scrapedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (scrapeError) {
      console.error('❌ Error scraping website:', scrapeError)
      
      // Return minimal data if scraping fails
      return new Response(JSON.stringify({
        url,
        title: 'Unable to extract title',
        metaDescription: 'Unable to extract description',
        content: `Website analysis for ${url} - content extraction failed`,
        timestamp: new Date().toISOString(),
        error: 'Content extraction failed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('💥 Error in website scraper:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    )
  }
})