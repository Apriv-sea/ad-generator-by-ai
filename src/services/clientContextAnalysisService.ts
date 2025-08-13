import { SecureLLMService } from './llm/secureLLMService';
import { supabase } from '@/integrations/supabase/client';

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

Analysez et retournez au format JSON:
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
            { role: 'system', content: 'Tu es un expert en analyse de sites web et création de contextes clients pour le marketing.' },
            { role: 'user', content: analysisPrompt }
          ],
          maxTokens: 1500,
          temperature: 0.3
        }
      });

      if (error) {
        throw new Error(`Erreur IA: ${error.message}`);
      }

      // La réponse est désormais normalisée par l'edge function
      const responseContent = data?.content || '';
      if (!responseContent) {
        console.error('Aucun contenu dans la réponse:', data);
        throw new Error('Réponse vide du service LLM');
      }

      console.log('🤖 Réponse du service LLM:', { 
        hasContent: !!responseContent, 
        contentLength: responseContent?.length,
        contentStart: responseContent?.substring(0, 200)
      });

      // Parser la réponse JSON
      let analysisResult: WebsiteAnalysis;
      try {
        // Extraire le JSON de la réponse
        const jsonMatch = responseContent?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        // Fallback avec des valeurs par défaut
        analysisResult = {
          industry: 'Non déterminé',
          toneOfVoice: 'Professionnel',
          keyMessages: ['Message principal à définir'],
          communicationStyle: 'Style à analyser',
          brandValues: ['À définir'],
          targetAudience: 'Cible à préciser'
        };
      }

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
      // Recherche avec Perplexity via edge function
      const { data: researchData, error: researchError } = await supabase.functions.invoke('market-research', {
        body: { 
          businessName,
          industry,
          query: `Analyse du marché ${industry} - concurrents, tendances, opportunités et défis pour ${businessName}`
        }
      });

      if (researchError) {
        throw new Error(`Erreur lors de la recherche: ${researchError.message}`);
      }

      // Analyser les résultats de recherche avec l'IA
      const analysisPrompt = `
Analysez les données de recherche sectorielle suivantes et structurez-les pour créer un contexte client pertinent.

Entreprise: ${businessName}
Secteur: ${industry}
Données de recherche: ${researchData.content || 'Données non disponibles'}

Retournez au format JSON:
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

      const { data, error } = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider,
          model,
          messages: [
            { role: 'system', content: 'Tu es un expert en analyse de marché et recherche concurrentielle.' },
            { role: 'user', content: analysisPrompt }
          ],
          maxTokens: 1500,
          temperature: 0.3
        }
      });

      if (error) {
        throw new Error(`Erreur IA: ${error.message}`);
      }

      // La réponse est désormais normalisée par l'edge function
      const responseContent = data?.content || '';
      if (!responseContent) {
        console.error('Aucun contenu dans la réponse:', data);
        throw new Error('Réponse vide du service LLM');
      }

      // Parser la réponse JSON
      let researchResult: MarketResearch;
      try {
        const jsonMatch = responseContent?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          researchResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        // Fallback
        researchResult = {
          competitiveAnalysis: 'Analyse concurrentielle à approfondir',
          marketTrends: 'Tendances du marché à identifier',
          opportunities: ['Opportunités à explorer'],
          challenges: ['Défis à relever']
        };
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

Générez un contexte client structuré au format JSON:
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
            { role: 'system', content: 'Tu es un expert en génération de contextes clients pour le marketing digital.' },
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

      // Parser la réponse JSON
      let contextResult: { businessContext: string; editorialGuidelines: string };
      try {
        const jsonMatch = responseContent?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          contextResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        // Fallback avec contexte généré à partir des données
        contextResult = {
          businessContext: `${data.businessName} évolue dans le secteur ${data.websiteAnalysis.industry} avec un positionnement ${data.websiteAnalysis.toneOfVoice}. L'entreprise cible ${data.websiteAnalysis.targetAudience} et communique avec un style ${data.websiteAnalysis.communicationStyle}. Les opportunités identifiées incluent ${data.marketResearch.opportunities.join(', ')}.`,
          editorialGuidelines: `Le contenu doit adopter un ton ${data.websiteAnalysis.toneOfVoice} en respectant les valeurs de la marque : ${data.websiteAnalysis.brandValues.join(', ')}. Les messages clés à mettre en avant sont : ${data.websiteAnalysis.keyMessages.join(', ')}.`
        };
      }

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