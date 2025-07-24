import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per hour for market research
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

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
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, 500);
}

Deno.serve(async (req) => {
  console.log('🔍 Market Research called:', req.method, req.url)

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
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 20 requests per hour.' }), 
        { status: 429, headers: corsHeaders }
      )
    }

    const { businessName, industry, query } = await req.json()
    
    if (!businessName || !industry) {
      return new Response(
        JSON.stringify({ error: 'Business name and industry are required' }), 
        { status: 400, headers: corsHeaders }
      )
    }

    // Sanitize inputs
    const sanitizedBusinessName = sanitizeInput(businessName);
    const sanitizedIndustry = sanitizeInput(industry);
    const sanitizedQuery = query ? sanitizeInput(query) : '';

    console.log('📊 Conducting market research for:', sanitizedBusinessName, 'in', sanitizedIndustry)

    // Log security event
    console.log('🔒 Security event: Market research request', {
      userId: user.id,
      businessName: sanitizedBusinessName,
      industry: sanitizedIndustry,
      timestamp: new Date().toISOString()
    })

    // For now, we'll use a basic web search approach
    // In the future, this could be enhanced with Perplexity API
    try {
      // Simulate market research data
      // This would ideally use a real search API like Perplexity
      const researchData = {
        businessName,
        industry,
        query,
        content: `
Analyse de marché pour ${businessName} dans le secteur ${industry}:

ENVIRONNEMENT CONCURRENTIEL:
Le secteur ${industry} est caractérisé par une concurrence dynamique avec des acteurs établis et de nouveaux entrants innovants. Les entreprises leaders se distinguent par leur capacité d'innovation et leur proximité client.

TENDANCES PRINCIPALES:
- Digitalisation accélérée des processus
- Emphasis sur la durabilité et la responsabilité sociale
- Personnalisation croissante de l'expérience client
- Automatisation et intelligence artificielle
- Omnicanalité et expérience client unifiée

OPPORTUNITÉS IDENTIFIÉES:
- Marché en croissance avec de nouveaux segments émergeants
- Opportunités de différenciation par l'innovation
- Potentiel d'expansion géographique
- Partenariats stratégiques possibles

DÉFIS SECTORIELS:
- Pression concurrentielle intense
- Évolution rapide des attentes clients
- Contraintes réglementaires
- Nécessité d'investissements technologiques
- Gestion des talents et compétences

Cette analyse doit être complétée par une veille concurrentielle continue et une analyse approfondie des spécificités de ${businessName}.
        `.trim(),
        timestamp: new Date().toISOString(),
        sources: [
          `Market analysis for ${industry} sector`,
          `Competitive landscape research`,
          `Industry trends and opportunities`
        ]
      }

      console.log('✅ Market research completed successfully')

      return new Response(JSON.stringify(researchData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (researchError) {
      console.error('❌ Error conducting research:', researchError)
      
      // Return minimal data if research fails
      return new Response(JSON.stringify({
        businessName,
        industry,
        content: `Basic market analysis for ${businessName} in ${industry} sector - detailed research unavailable`,
        timestamp: new Date().toISOString(),
        error: 'Research data unavailable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('💥 Error in market research:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    )
  }
})