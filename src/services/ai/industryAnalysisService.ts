import { supabase } from '@/integrations/supabase/client';

export interface IndustryAnalysisResult {
  suggestedIndustry: string;
  confidence: number;
  reasoning: string;
  alternativeOptions: string[];
}

export interface IndustryDefinition {
  key: string;
  label: string;
  description: string;
  keywords: string[];
  examples: string[];
}

// Définitions complètes des secteurs avec mots-clés
export const INDUSTRIES: IndustryDefinition[] = [
  {
    key: 'e-commerce',
    label: 'E-commerce & Vente en ligne',
    description: 'Boutiques en ligne, marketplaces, vente de produits physiques',
    keywords: ['boutique', 'vente', 'produits', 'commande', 'livraison', 'panier', 'catalogue'],
    examples: ['Boutique de vêtements en ligne', 'Marketplace artisanale', 'Vente d\'électronique']
  },
  {
    key: 'services-professionnels',
    label: 'Services Professionnels',
    description: 'Conseil, expertise, services B2B, agences',
    keywords: ['conseil', 'expertise', 'consultant', 'service', 'accompagnement', 'stratégie', 'audit'],
    examples: ['Cabinet comptable', 'Agence marketing', 'Consultant en management']
  },
  {
    key: 'technologie',
    label: 'Technologie & Digital',
    description: 'SaaS, développement, IT, solutions numériques',
    keywords: ['logiciel', 'application', 'développement', 'cloud', 'digital', 'tech', 'plateforme'],
    examples: ['SaaS de gestion', 'Agence web', 'Startup tech']
  },
  {
    key: 'immobilier',
    label: 'Immobilier',
    description: 'Vente, location, gestion immobilière',
    keywords: ['immobilier', 'vente', 'location', 'maison', 'appartement', 'terrain', 'biens'],
    examples: ['Agence immobilière', 'Promoteur', 'Gestion locative']
  },
  {
    key: 'sante-bien-etre',
    label: 'Santé & Bien-être',
    description: 'Soins, thérapies, fitness, nutrition',
    keywords: ['santé', 'soin', 'thérapie', 'médical', 'bien-être', 'fitness', 'nutrition'],
    examples: ['Cabinet médical', 'Salle de sport', 'Coach nutrition']
  },
  {
    key: 'formation-education',
    label: 'Formation & Éducation',
    description: 'Cours, formations, coaching, développement personnel',
    keywords: ['formation', 'cours', 'apprentissage', 'éducation', 'coaching', 'enseignement'],
    examples: ['Centre de formation', 'École en ligne', 'Coach professionnel']
  },
  {
    key: 'finance-assurance',
    label: 'Finance & Assurance',
    description: 'Services financiers, assurances, investissement',
    keywords: ['finance', 'assurance', 'crédit', 'prêt', 'investissement', 'épargne', 'courtage'],
    examples: ['Courtier en crédit', 'Assurance auto', 'Conseil financier']
  },
  {
    key: 'tourisme-loisirs',
    label: 'Tourisme & Loisirs',
    description: 'Voyages, hébergement, activités de loisirs',
    keywords: ['voyage', 'vacances', 'hôtel', 'restaurant', 'loisirs', 'activité', 'tourisme'],
    examples: ['Agence de voyage', 'Gîte rural', 'Parc d\'attractions']
  },
  {
    key: 'automobile',
    label: 'Automobile',
    description: 'Vente, réparation, services automobiles',
    keywords: ['voiture', 'auto', 'garage', 'réparation', 'vente', 'occasion', 'mécanique'],
    examples: ['Concession auto', 'Garage', 'Vente véhicules d\'occasion']
  },
  {
    key: 'restaurant-alimentation',
    label: 'Restaurant & Alimentation',
    description: 'Restauration, traiteur, alimentation',
    keywords: ['restaurant', 'cuisine', 'repas', 'traiteur', 'alimentation', 'food', 'gastronomie'],
    examples: ['Restaurant traditionnel', 'Food truck', 'Traiteur événementiel']
  },
  {
    key: 'mode-beaute',
    label: 'Mode & Beauté',
    description: 'Vêtements, cosmétiques, coiffure, esthétique',
    keywords: ['mode', 'beauté', 'vêtement', 'cosmétique', 'coiffure', 'esthétique', 'style'],
    examples: ['Salon de coiffure', 'Boutique mode', 'Institut de beauté']
  },
  {
    key: 'construction-renovation',
    label: 'Construction & Rénovation',
    description: 'BTP, rénovation, artisanat du bâtiment',
    keywords: ['construction', 'rénovation', 'bâtiment', 'travaux', 'artisan', 'maçonnerie'],
    examples: ['Entreprise BTP', 'Artisan électricien', 'Architecte']
  },
  {
    key: 'sport-fitness',
    label: 'Sport & Fitness',
    description: 'Salles de sport, coaching, équipements sportifs',
    keywords: ['sport', 'fitness', 'musculation', 'coach', 'entraînement', 'gymnastique'],
    examples: ['Salle de fitness', 'Coach sportif', 'Vente équipements sport']
  },
  {
    key: 'juridique',
    label: 'Juridique',
    description: 'Avocats, notaires, services juridiques',
    keywords: ['avocat', 'juridique', 'droit', 'notaire', 'conseil', 'justice', 'contentieux'],
    examples: ['Cabinet d\'avocat', 'Notaire', 'Conseil juridique']
  },
  {
    key: 'autre',
    label: 'Autre secteur',
    description: 'Secteur non listé ci-dessus',
    keywords: [],
    examples: ['Secteur spécialisé', 'Activité unique', 'Domaine émergent']
  }
];

export class IndustryAnalysisService {
  /**
   * Analyse le contexte business d'un client et suggère le secteur le plus approprié
   */
  static async analyzeIndustry(
    businessContext: string,
    clientName?: string,
    additionalInfo?: string
  ): Promise<IndustryAnalysisResult> {
    try {
      console.log('🔍 Analyse du secteur pour:', { businessContext, clientName });

      // Construire le prompt d'analyse
      const analysisPrompt = this.buildAnalysisPrompt(businessContext, clientName, additionalInfo);

      // Appeler l'IA pour l'analyse
      const { data, error } = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          messages: [
            { 
              role: 'system', 
              content: 'Tu es un expert en classification d\'entreprises et secteurs d\'activité. Tu analyses les descriptions d\'entreprises pour déterminer leur secteur principal avec précision.' 
            },
            { role: 'user', content: analysisPrompt }
          ],
          maxTokens: 1000,
          temperature: 0.3 // Peu de créativité pour plus de précision
        }
      });

      if (error) {
        throw new Error(`Erreur IA: ${error.message}`);
      }

      // La réponse est désormais normalisée par l'edge function
      const analysisText = data?.content || '';
      if (!analysisText) {
        console.error('Aucun contenu dans la réponse:', data);
        throw new Error('Réponse vide du service LLM');
      }
      
      const result = this.parseAnalysisResult(analysisText);

      console.log('✅ Analyse secteur terminée:', result);
      return result;

    } catch (error) {
      console.error('❌ Erreur analyse secteur:', error);
      
      // Fallback : analyse par mots-clés
      return this.fallbackKeywordAnalysis(businessContext);
    }
  }

  /**
   * Construit le prompt d'analyse pour l'IA
   */
  private static buildAnalysisPrompt(
    businessContext: string,
    clientName?: string,
    additionalInfo?: string
  ): string {
    const industriesList = INDUSTRIES.map(ind => 
      `- ${ind.key}: ${ind.label} (${ind.description})`
    ).join('\n');

    return `Analyse cette entreprise et détermine son secteur d'activité principal :

ENTREPRISE : ${clientName || 'Client'}
DESCRIPTION : ${businessContext}
${additionalInfo ? `INFOS SUPPLÉMENTAIRES : ${additionalInfo}` : ''}

SECTEURS DISPONIBLES :
${industriesList}

CONSIGNES :
1. Analyse attentivement la description
2. Identifie l'activité PRINCIPALE (pas les activités secondaires)
3. Choisis le secteur le PLUS SPÉCIFIQUE possible
4. Si hésitation entre plusieurs secteurs, privilégie celui qui correspond le mieux au cœur de métier

RÉPONSE ATTENDUE (JSON strict) :
{
  "suggestedIndustry": "clé-du-secteur-choisi",
  "confidence": 85,
  "reasoning": "Explication claire du choix basée sur les éléments de description",
  "alternativeOptions": ["secteur-alternatif-1", "secteur-alternatif-2"]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant/après.`;
  }

  /**
   * Parse le résultat de l'analyse IA
   */
  private static parseAnalysisResult(analysisText: string): IndustryAnalysisResult {
    try {
      // Extraire le JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Pas de JSON trouvé dans la réponse');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Valider la structure
      if (!parsed.suggestedIndustry || typeof parsed.confidence !== 'number') {
        throw new Error('Structure JSON invalide');
      }

      // Vérifier que le secteur suggéré existe
      const industryExists = INDUSTRIES.some(ind => ind.key === parsed.suggestedIndustry);
      if (!industryExists) {
        throw new Error(`Secteur suggéré invalide: ${parsed.suggestedIndustry}`);
      }

      return {
        suggestedIndustry: parsed.suggestedIndustry,
        confidence: Math.min(100, Math.max(0, parsed.confidence)),
        reasoning: parsed.reasoning || 'Analyse basée sur les mots-clés du contexte',
        alternativeOptions: (parsed.alternativeOptions || []).filter(opt => 
          INDUSTRIES.some(ind => ind.key === opt)
        )
      };

    } catch (error) {
      console.error('Erreur parsing analyse IA:', error);
      throw error;
    }
  }

  /**
   * Analyse de fallback basée sur les mots-clés
   */
  private static fallbackKeywordAnalysis(businessContext: string): IndustryAnalysisResult {
    const text = businessContext.toLowerCase();
    const scores: { [key: string]: number } = {};

    // Calculer les scores pour chaque secteur
    INDUSTRIES.forEach(industry => {
      let score = 0;
      
      industry.keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });

      // Bonus si le label du secteur est mentionné
      if (text.includes(industry.label.toLowerCase())) {
        score += 2;
      }

      scores[industry.key] = score;
    });

    // Trouver le secteur avec le meilleur score
    const sortedScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    if (sortedScores.length === 0) {
      return {
        suggestedIndustry: 'autre',
        confidence: 30,
        reasoning: 'Aucun mot-clé spécifique détecté, secteur général suggéré',
        alternativeOptions: ['services-professionnels', 'technologie']
      };
    }

    const [topIndustry, topScore] = sortedScores[0];
    const confidence = Math.min(80, topScore * 20); // Max 80% pour fallback

    return {
      suggestedIndustry: topIndustry,
      confidence,
      reasoning: `Analyse par mots-clés - Score: ${topScore}`,
      alternativeOptions: sortedScores.slice(1, 3).map(([key]) => key)
    };
  }

  /**
   * Obtenir les détails d'un secteur par sa clé
   */
  static getIndustryDetails(industryKey: string): IndustryDefinition | null {
    return INDUSTRIES.find(ind => ind.key === industryKey) || null;
  }

  /**
   * Obtenir tous les secteurs disponibles
   */
  static getAllIndustries(): IndustryDefinition[] {
    return INDUSTRIES;
  }

  /**
   * Rechercher des secteurs par mot-clé
   */
  static searchIndustries(query: string): IndustryDefinition[] {
    const searchTerm = query.toLowerCase();
    
    return INDUSTRIES.filter(industry => 
      industry.label.toLowerCase().includes(searchTerm) ||
      industry.description.toLowerCase().includes(searchTerm) ||
      industry.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }
}