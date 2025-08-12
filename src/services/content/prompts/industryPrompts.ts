// Configuration des prompts spécialisés par secteur d'activité

export interface IndustryPromptConfig {
  basePersonality: string;
  specificRules: string[];
  actionWords: string[];
  urgencyTactics: string[];
  valuePropositions: string[];
  callsToAction: string[];
}

export const INDUSTRY_PROMPTS: Record<string, IndustryPromptConfig> = {
  'e-commerce': {
    basePersonality: "Tu es un expert en rédaction publicitaire e-commerce avec une spécialisation dans la conversion en ligne et l'optimisation des ventes.",
    specificRules: [
      "Mettre l'accent sur la disponibilité immédiate",
      "Inclure des éléments de réassurance (livraison, retours)",
      "Créer un sentiment d'urgence avec les stocks ou promotions",
      "Valoriser le rapport qualité-prix"
    ],
    actionWords: ["Achetez", "Commandez", "Profitez", "Découvrez", "Économisez"],
    urgencyTactics: ["Stock limité", "Offre limitée", "Livraison rapide", "Promo exclusive"],
    valuePropositions: ["Meilleur prix", "Livraison gratuite", "Qualité garantie", "Satisfaction client"],
    callsToAction: ["Commandez maintenant", "Achetez en ligne", "Profitez de l'offre", "Découvrez la collection"]
  },

  'services': {
    basePersonality: "Tu es un expert en rédaction publicitaire pour les services professionnels avec une expertise dans la génération de leads qualifiés.",
    specificRules: [
      "Mettre l'accent sur l'expertise et l'expérience",
      "Inclure des éléments de confiance et crédibilité",
      "Valoriser la personnalisation du service",
      "Créer de la proximité et de la disponibilité"
    ],
    actionWords: ["Contactez", "Demandez", "Consultez", "Planifiez", "Réservez"],
    urgencyTactics: ["Consultation gratuite", "Devis rapide", "Expertise locale", "Disponible immédiatement"],
    valuePropositions: ["Expert certifié", "Service personnalisé", "Satisfaction garantie", "Devis gratuit"],
    callsToAction: ["Contactez-nous", "Demandez un devis", "Réservez votre consultation", "Planifiez un RDV"]
  },

  'restaurant': {
    basePersonality: "Tu es un expert en rédaction publicitaire pour la restauration avec une spécialisation dans l'attraction de clientèle locale.",
    specificRules: [
      "Mettre l'accent sur la fraîcheur et la qualité des produits",
      "Créer l'envie avec des descriptions appétissantes",
      "Valoriser l'expérience culinaire et l'ambiance",
      "Inclure des éléments de proximité et tradition"
    ],
    actionWords: ["Savourez", "Dégustez", "Réservez", "Découvrez", "Goûtez"],
    urgencyTactics: ["Menu du jour", "Spécialité maison", "Produits frais", "Réservation conseillée"],
    valuePropositions: ["Cuisine authentique", "Produits frais", "Ambiance chaleureuse", "Chef expérimenté"],
    callsToAction: ["Réservez maintenant", "Découvrez la carte", "Venez déguster", "Savourez l'expérience"]
  },

  'immobilier': {
    basePersonality: "Tu es un expert en rédaction publicitaire immobilier avec une expertise dans la génération de prospects qualifiés.",
    specificRules: [
      "Mettre l'accent sur l'emplacement et les caractéristiques uniques",
      "Créer de l'émotion avec le potentiel du lieu de vie",
      "Valoriser l'investissement et l'opportunité",
      "Inclure des éléments de rareté et d'exclusivité"
    ],
    actionWords: ["Visitez", "Découvrez", "Investissez", "Contactez", "Explorez"],
    urgencyTactics: ["Visite exclusive", "Opportunité rare", "Prix attractif", "Disponible immédiatement"],
    valuePropositions: ["Emplacement privilégié", "Bien d'exception", "Investissement sûr", "Cadre de vie idéal"],
    callsToAction: ["Planifiez une visite", "Contactez l'agent", "Découvrez le bien", "Demandez plus d'infos"]
  },

  'sante': {
    basePersonality: "Tu es un expert en rédaction publicitaire pour le secteur de la santé avec une approche éthique et rassurante.",
    specificRules: [
      "Mettre l'accent sur le bien-être et la qualité de vie",
      "Inclure des éléments de réassurance et professionnalisme",
      "Valoriser l'expertise médicale et la technologie",
      "Créer de la confiance avec la discrétion et l'écoute"
    ],
    actionWords: ["Consultez", "Prenez soin", "Améliorez", "Prévenez", "Soignez"],
    urgencyTactics: ["RDV rapide", "Prévention importante", "Santé prioritaire", "Consultation disponible"],
    valuePropositions: ["Expertise médicale", "Soins personnalisés", "Technologie avancée", "Équipe qualifiée"],
    callsToAction: ["Prenez RDV", "Consultez un spécialiste", "Contactez le cabinet", "Planifiez votre visite"]
  },

  'education': {
    basePersonality: "Tu es un expert en rédaction publicitaire pour l'éducation avec une focus sur le développement personnel et professionnel.",
    specificRules: [
      "Mettre l'accent sur l'amélioration et la progression",
      "Valoriser l'acquisition de compétences et connaissances",
      "Créer de l'aspiration avec les résultats obtenus",
      "Inclure des éléments de flexibilité et accessibilité"
    ],
    actionWords: ["Apprenez", "Formez-vous", "Développez", "Maîtrisez", "Progressez"],
    urgencyTactics: ["Formation limitée", "Inscription ouverte", "Début imminent", "Places disponibles"],
    valuePropositions: ["Formation certifiante", "Experts reconnus", "Méthode éprouvée", "Suivi personnalisé"],
    callsToAction: ["Inscrivez-vous", "Commencez votre formation", "Découvrez le programme", "Demandez des infos"]
  },

  'technologie': {
    basePersonality: "Tu es un expert en rédaction publicitaire tech avec une spécialisation dans l'innovation et les solutions digitales.",
    specificRules: [
      "Mettre l'accent sur l'innovation et la performance",
      "Valoriser l'efficacité et le gain de temps",
      "Créer de l'exclusivité avec la technologie avancée",
      "Inclure des éléments de simplicité d'utilisation"
    ],
    actionWords: ["Optimisez", "Automatisez", "Simplifiez", "Innovez", "Transformez"],
    urgencyTactics: ["Technologie avancée", "Solution unique", "Performance optimale", "Évolution nécessaire"],
    valuePropositions: ["Innovation leader", "Solution complète", "Performance garantie", "Support expert"],
    callsToAction: ["Testez la solution", "Demandez une démo", "Découvrez l'innovation", "Optimisez maintenant"]
  },

  'finance': {
    basePersonality: "Tu es un expert en rédaction publicitaire financière avec une approche de confiance et de sécurité.",
    specificRules: [
      "Mettre l'accent sur la sécurité et la fiabilité",
      "Valoriser l'expertise et l'accompagnement personnalisé",
      "Créer de la confiance avec la transparence",
      "Inclure des éléments de performance et rentabilité"
    ],
    actionWords: ["Investissez", "Économisez", "Planifiez", "Sécurisez", "Optimisez"],
    urgencyTactics: ["Opportunité d'investissement", "Conseil personnalisé", "Analyse gratuite", "Expertise reconnue"],
    valuePropositions: ["Sécurité garantie", "Conseil expert", "Performance optimisée", "Accompagnement personnalisé"],
    callsToAction: ["Contactez un conseiller", "Demandez une analyse", "Planifiez votre avenir", "Optimisez vos finances"]
  },

  'default': {
    basePersonality: "Tu es un expert en rédaction publicitaire Google Ads avec 10 ans d'expérience et une approche universelle.",
    specificRules: [
      "Adapter le ton au secteur d'activité du client",
      "Créer un sentiment d'urgence ou d'opportunité",
      "Mettre en avant la valeur ajoutée unique",
      "Utiliser des mots d'action forts"
    ],
    actionWords: ["Découvrez", "Profitez", "Contactez", "Essayez", "Bénéficiez"],
    urgencyTactics: ["Offre limitée", "Opportunité unique", "Disponible maintenant", "Action rapide"],
    valuePropositions: ["Qualité supérieure", "Service expert", "Solution adaptée", "Résultats garantis"],
    callsToAction: ["Contactez-nous", "Découvrez l'offre", "Profitez maintenant", "Demandez plus d'infos"]
  }
};

// Helper pour normaliser les noms d'industrie
export function normalizeIndustryName(industry: string | undefined): string {
  if (!industry) return 'default';
  
  const normalized = industry.toLowerCase().trim();
  
  // Mapping des variations possibles
  const industryMappings: Record<string, string> = {
    'ecommerce': 'e-commerce',
    'e-commerce': 'e-commerce',
    'commerce': 'e-commerce',
    'vente en ligne': 'e-commerce',
    'boutique': 'e-commerce',
    
    'service': 'services',
    'services': 'services',
    'consulting': 'services',
    'conseil': 'services',
    
    'restaurant': 'restaurant',
    'restauration': 'restaurant',
    'café': 'restaurant',
    'bar': 'restaurant',
    'alimentation': 'restaurant',
    
    'immobilier': 'immobilier',
    'real estate': 'immobilier',
    'propriété': 'immobilier',
    
    'santé': 'sante',
    'health': 'sante',
    'médical': 'sante',
    'dentaire': 'sante',
    'pharmacie': 'sante',
    
    'formation': 'education',
    'éducation': 'education',
    'école': 'education',
    'université': 'education',
    'cours': 'education',
    
    'tech': 'technologie',
    'technologie': 'technologie',
    'it': 'technologie',
    'software': 'technologie',
    'digital': 'technologie',
    
    'banque': 'finance',
    'assurance': 'finance',
    'finance': 'finance',
    'investissement': 'finance'
  };
  
  return industryMappings[normalized] || 'default';
}