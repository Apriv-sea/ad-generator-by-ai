import { SecureLLMService } from './llm/secureLLMService';
import { supabase } from '@/integrations/supabase/client';
import { parseWebsiteAnalysis, parseMarketResearch, parseClientContext, extractJsonFromLLMResponse } from '@/utils/jsonParser';

interface WebsiteAnalysis {
  industry: string;
  toneOfVoice: string;
  keyMessages: string[];
  communicationStyle: string;
  brandValues: string[];
  targetAudience: string;
}

interface MarketResearch {
  competitiveAnalysis: string;
  marketTrends: string;
  opportunities: string[];
  challenges: string[];
}

interface ClientContextData {
  businessName: string;
  websiteUrl: string;
  websiteAnalysis: WebsiteAnalysis;
  marketResearch: MarketResearch;
}

interface GeneratedContext {
  industry: string;
  toneOfVoice: string;
  keyMessages: string[];
  communicationStyle: string;
  competitiveAnalysis: string;
  marketTrends: string;
  businessContext: string;
  editorialGuidelines: string;
  targetAudience: string;
  brandValues: string[];
}

export class ClientContextAnalysisService {
  
  // Vérifier si l'utilisateur a des clés API configurées
  static async checkApiKeysAvailability(): Promise<{ hasKeys: boolean; providers: string[] }> {
    try {
      const validation = await SecureLLMService.validateApiKeys();
      const availableProviders = Object.entries(validation)
        .filter(([_, isValid]) => isValid)
        .map(([provider, _]) => provider);
      
      return {
        hasKeys: availableProviders.length > 0,
        providers: availableProviders
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des clés API:', error);
      return { hasKeys: false, providers: [] };
    }
  }

  // Analyser le site web d'un client
  static async analyzeWebsite(websiteUrl: string, selectedModel: string = 'openai:gpt-4.1-2025-04-14'): Promise<WebsiteAnalysis> {
    console.log('🌐 Analyse du site web:', websiteUrl);
    
    // Vérifier les clés API
    const { hasKeys, providers } = await this.checkApiKeysAvailability();
    console.log('🔑 Clés API disponibles:', { hasKeys, providers });
    
    if (!hasKeys) {
      throw new Error('Aucune clé API configurée. Veuillez configurer vos clés API dans les paramètres.');
    }

    try {
      // Scraper le contenu du site avec Firecrawl via edge function
      console.log('📡 Appel du website-scraper pour:', websiteUrl);
      const { data: scrapedData, error: scrapeError } = await supabase.functions.invoke('website-scraper', {
        body: { url: websiteUrl }
      });

      console.log('📡 Réponse du website-scraper:', { 
        hasData: !!scrapedData, 
        hasError: !!scrapeError,
        dataKeys: scrapedData ? Object.keys(scrapedData) : [],
        error: scrapeError 
      });

      if (scrapeError) {
        throw new Error(`Erreur lors du scraping: ${scrapeError.message}`);
      }

      // Analyser le contenu avec l'IA
      const analysisPrompt = `
Analysez le contenu suivant d'un site web et extrayez les informations clés pour créer un contexte client.

URL: ${websiteUrl}
Contenu: ${scrapedData.content || 'Contenu non disponible'}

Retournez UNIQUEMENT un objet JSON valide sans texte d'introduction ni conclusion:
{
  "industry": "secteur d'activité principal",
  "toneOfVoice": "ton de communication (professionnel, décontracté, innovant, etc.)",
  "keyMessages": ["message clé 1", "message clé 2", "message clé 3"],
  "communicationStyle": "description du style de communication",
  "brandValues": ["valeur 1", "valeur 2", "valeur 3"],
  "targetAudience": "description de la cible principale"
}

Soyez précis et basez-vous uniquement sur le contenu fourni.
      `;

      // Parser le modèle sélectionné
      const [provider, model] = selectedModel.includes(':') 
        ? selectedModel.split(':') 
        : ['openai', selectedModel];

      console.log('🤖 Appel du service LLM avec:', { provider, model, contentLength: analysisPrompt.length });

      const { data, error } = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider,
          model,
          messages: [
            { role: 'system', content: 'Tu es un expert en analyse de sites web et création de contextes clients pour le marketing. Tu réponds UNIQUEMENT avec du JSON valide sans texte additionnel.' },
            { role: 'user', content: analysisPrompt }
          ],
          maxTokens: 1500,
          temperature: 0.3
        }
      });

      if (error) {
        throw new Error(`Erreur IA: ${error.message}`);
      }

      // Debug de la réponse de l'edge function
      console.log('🔍 Debug - Réponse brute complète:', data);
      console.log('🔍 Type de data:', typeof data);
      console.log('🔍 Keys de data:', data ? Object.keys(data) : 'N/A');
      
      // Essayer plusieurs chemins d'extraction
      let responseContent = '';
      if (data) {
        if (typeof data === 'string') {
          responseContent = data;
        } else if (data.content) {
          responseContent = data.content;
        } else if (data.message?.content) {
          responseContent = data.message.content;
        } else if (data.choices?.[0]?.message?.content) {
          responseContent = data.choices[0].message.content;
        } else if (data.original?.content?.[0]?.text) {
          responseContent = data.original.content[0].text;
        } else {
          // Chercher récursivement dans l'objet
          const findContent = (obj: any): string => {
            if (typeof obj === 'string' && obj.includes('industry')) return obj;
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                const result = findContent(obj[key]);
                if (result) return result;
              }
            }
            return '';
          };
          responseContent = findContent(data);
        }
      }
      
      console.log('🤖 Contenu final extrait:', { 
        hasContent: !!responseContent, 
        contentLength: responseContent?.length,
        contentPreview: responseContent?.substring(0, 300)
      });

      if (!responseContent) {
        console.error('🚨 ÉCHEC EXTRACTION - Dump complet:', JSON.stringify(data, null, 2));
        throw new Error('Impossible d\'extraire le contenu de la réponse LLM');
      }

      // Parser la réponse JSON avec l'utilitaire robuste
      const analysisResult = parseWebsiteAnalysis(responseContent);

      console.log('✅ Analyse du site terminée:', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse du site:', error);
      throw new Error(`Impossible d'analyser le site web: ${(error as Error).message}`);
    }
  }

  // Effectuer une recherche sectorielle
  static async conductMarketResearch(businessName: string, industry: string, selectedModel: string = 'openai:gpt-4.1-2025-04-14'): Promise<MarketResearch> {
    console.log('🔍 Recherche sectorielle pour:', businessName, 'dans', industry);
    
    try {
      // Recherche avec market-research edge function
      console.log('📡 Appel du market-research pour:', businessName, 'dans', industry);
      const { data: researchData, error: researchError } = await supabase.functions.invoke('market-research', {
        body: { 
          businessName,
          industry,
          query: `Analyse du marché ${industry} - concurrents, tendances, opportunités et défis pour ${businessName}`
        }
      });

      console.log('📡 Réponse du market-research:', { 
        hasData: !!researchData, 
        hasError: !!researchError,
        dataKeys: researchData ? Object.keys(researchData) : [],
        error: researchError 
      });

      if (researchError) {
        throw new Error(`Erreur lors de la recherche: ${researchError.message}`);
      }

      // Analyser les résultats de recherche avec l'IA pour structurer les données
      const analysisPrompt = `
Analysez les données de recherche sectorielle suivantes et structurez-les pour créer un contexte client pertinent.

Entreprise: ${businessName}
Secteur: ${industry}
Données de recherche: ${researchData.content || 'Données non disponibles'}

Retournez UNIQUEMENT un objet JSON valide sans texte d'introduction ni conclusion:
{
  "competitiveAnalysis": "analyse détaillée de la concurrence et positionnement",
  "marketTrends": "tendances principales du secteur",
  "opportunities": ["opportunité 1", "opportunité 2", "opportunité 3"],
  "challenges": ["défi 1", "défi 2", "défi 3"]
}

Soyez précis et actionnable pour une stratégie marketing.
      `;

      // Parser le modèle sélectionné
      const [provider, model] = selectedModel.includes(':') 
        ? selectedModel.split(':') 
        : ['openai', selectedModel];

      console.log('🤖 Appel du service LLM avec:', { provider, model, contentLength: analysisPrompt.length });

      const { data, error } = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider,
          model,
          messages: [
            { role: 'system', content: 'Tu es un expert en analyse de marché et recherche concurrentielle. Tu réponds UNIQUEMENT avec du JSON valide sans texte additionnel.' },
            { role: 'user', content: analysisPrompt }
          ],
          maxTokens: 1500,
          temperature: 0.3
        }
      });

      if (error) {
        throw new Error(`Erreur IA: ${error.message}`);
      }

      // La réponse est normalisée par l'edge function
      const responseContent = data?.content || '';
      console.log('🤖 Réponse du service LLM pour recherche:', { 
        hasContent: !!responseContent, 
        contentLength: responseContent?.length,
        contentStart: responseContent?.substring(0, 200)
      });

      if (!responseContent) {
        console.error('Aucun contenu dans la réponse:', data);
        throw new Error('Réponse vide du service LLM');
      }

      // Parser la réponse JSON avec l'utilitaire ultra-robuste
      let researchResult;
      try {
        researchResult = parseMarketResearch(responseContent);
      } catch (parseError) {
        console.warn('❌ Échec du parsing standard, tentative avec extracteur ultra-robuste');
        const extracted = extractJsonFromLLMResponse(responseContent);
        if (extracted) {
          researchResult = {
            competitiveAnalysis: extracted.competitiveAnalysis || 'Analyse concurrentielle non disponible',
            marketTrends: extracted.marketTrends || 'Tendances de marché non disponibles',
            opportunities: extracted.opportunities || ['Opportunités à explorer'],
            challenges: extracted.challenges || ['Défis à identifier']
          };
        } else {
          throw new Error('Impossible de parser la réponse JSON');
        }
      }

      console.log('✅ Recherche sectorielle terminée:', researchResult);
      return researchResult;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche sectorielle:', error);
      throw new Error(`Impossible d'effectuer la recherche sectorielle: ${(error as Error).message}`);
    }
  }

  // Générer le contexte client final
  static async generateClientContext(data: ClientContextData, selectedModel: string = 'openai:gpt-4.1-2025-04-14'): Promise<GeneratedContext> {
    console.log('🧠 Génération du contexte client pour:', data.businessName);
    
    try {
      const contextPrompt = `
Créez un contexte client complet et professionnel basé sur les analyses suivantes.

ENTREPRISE: ${data.businessName}
SITE WEB: ${data.websiteUrl}

ANALYSE DU SITE WEB:
- Secteur: ${data.websiteAnalysis.industry}
- Ton: ${data.websiteAnalysis.toneOfVoice}
- Messages clés: ${data.websiteAnalysis.keyMessages.join(', ')}
- Style: ${data.websiteAnalysis.communicationStyle}
- Valeurs: ${data.websiteAnalysis.brandValues.join(', ')}
- Cible: ${data.websiteAnalysis.targetAudience}

RECHERCHE MARCHÉ:
- Analyse concurrentielle: ${data.marketResearch.competitiveAnalysis}
- Tendances: ${data.marketResearch.marketTrends}
- Opportunités: ${data.marketResearch.opportunities.join(', ')}
- Défis: ${data.marketResearch.challenges.join(', ')}

Retournez UNIQUEMENT un objet JSON valide sans texte d'introduction ni conclusion:
{
  "businessContext": "contexte business détaillé et actionnable (200-300 mots)",
  "editorialGuidelines": "guidelines éditoriales précises pour la création de contenu (150-200 mots)"
}

Le contexte doit être:
- Professionnel et détaillé
- Actionnable pour la création de campagnes publicitaires
- Basé sur les données analysées
- Adapté au secteur et à la cible
      `;

      // Parser le modèle sélectionné
      const [provider, model] = selectedModel.includes(':') 
        ? selectedModel.split(':') 
        : ['openai', selectedModel];

      const { data: llmResponse, error } = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider,
          model,
          messages: [
            { role: 'system', content: 'Tu es un expert en génération de contextes clients pour le marketing digital. Tu réponds UNIQUEMENT avec du JSON valide sans texte additionnel.' },
            { role: 'user', content: contextPrompt }
          ],
          maxTokens: 2000,
          temperature: 0.3
        }
      });

      if (error) {
        throw new Error(`Erreur IA: ${error.message}`);
      }

      // La réponse est désormais normalisée par l'edge function
      const responseContent = llmResponse?.content || '';
      if (!responseContent) {
        console.error('Aucun contenu dans la réponse:', llmResponse);
        throw new Error('Réponse vide du service LLM');
      }

      // Parser la réponse JSON avec l'utilitaire robuste
      const contextResult = parseClientContext(responseContent);

      // Combiner toutes les données
      const finalContext: GeneratedContext = {
        industry: data.websiteAnalysis.industry,
        toneOfVoice: data.websiteAnalysis.toneOfVoice,
        keyMessages: data.websiteAnalysis.keyMessages,
        communicationStyle: data.websiteAnalysis.communicationStyle,
        competitiveAnalysis: data.marketResearch.competitiveAnalysis,
        marketTrends: data.marketResearch.marketTrends,
        businessContext: contextResult.businessContext,
        editorialGuidelines: contextResult.editorialGuidelines,
        targetAudience: data.websiteAnalysis.targetAudience,
        brandValues: data.websiteAnalysis.brandValues
      };

      console.log('✅ Contexte client généré avec succès');
      return finalContext;

    } catch (error) {
      console.error('❌ Erreur lors de la génération du contexte:', error);
      throw new Error(`Impossible de générer le contexte client: ${(error as Error).message}`);
    }
  }
}