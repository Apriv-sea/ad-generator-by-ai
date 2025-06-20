/**
 * Service pour interagir avec CryptPad
 */

export interface CryptPadSheet {
  id: string;
  name: string;
  url: string;
  type: 'calc' | 'sheet';
}

export interface CryptPadData {
  values: string[][];
  title?: string;
}

export class CryptPadService {
  /**
   * Extraire l'ID CryptPad depuis une URL
   */
  extractPadId(url: string): string | null {
    try {
      // CryptPad URLs format: https://cryptpad.fr/sheet/#/2/sheet/edit/...
      const match = url.match(/cryptpad\.fr\/(?:sheet|calc)\/#\/\d+\/(?:sheet|calc)\/edit\/([^\/]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Erreur lors de l'extraction de l'ID CryptPad:", error);
      return null;
    }
  }

  /**
   * Valider qu'un ID CryptPad est au bon format
   */
  validatePadId(padId: string): boolean {
    return /^[a-zA-Z0-9+\/=]+$/.test(padId) && padId.length > 10;
  }

  /**
   * Obtenir l'URL d'intégration pour un pad CryptPad
   */
  getEmbedUrl(padId: string): string {
    return `https://cryptpad.fr/sheet/#/2/sheet/view/${padId}/embed/`;
  }

  /**
   * Obtenir les en-têtes standards pour une feuille de campagnes
   */
  getStandardHeaders(): string[] {
    return [
      'Nom de la campagne',
      'Nom du groupe d\'annonces',
      'État du groupe d\'annonces',
      'Type de correspondance par défaut',
      'Top 3 mots-clés (séparés par des virgules)',
      'Titre 1',
      'Titre 2',
      'Titre 3',
      'Description 1',
      'Description 2',
      'URL finale',
      'Chemin d\'affichage 1',
      'Chemin d\'affichage 2',
      'Mots-clés ciblés',
      'Mots-clés négatifs',
      'Audience ciblée',
      'Extensions d\'annonces'
    ];
  }

  /**
   * Initialiser une feuille avec les en-têtes standards
   */
  async initializeSheetWithHeaders(padId: string): Promise<boolean> {
    try {
      const headers = this.getStandardHeaders();
      const initialData = [headers];
      
      // Ajouter quelques lignes vides pour commencer
      for (let i = 0; i < 10; i++) {
        initialData.push(new Array(headers.length).fill(''));
      }
      
      return await this.saveSheetData(padId, initialData);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la feuille:", error);
      return false;
    }
  }

  /**
   * Simuler la récupération de données depuis CryptPad
   * Dans une vraie implémentation, ceci ferait un appel API
   */
  async getSheetData(padId: string): Promise<CryptPadData> {
    if (!this.validatePadId(padId)) {
      throw new Error('ID de pad CryptPad invalide');
    }

    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Vérifier d'abord si des données existent localement
    const localData = localStorage.getItem(`cryptpad_data_${padId}`);
    if (localData) {
      return JSON.parse(localData);
    }

    // Données d'exemple pour la démo avec en-têtes standards
    const sampleData: CryptPadData = {
      title: 'Feuille CryptPad - Campagnes',
      values: [
        this.getStandardHeaders(),
        [
          'Campagne Mode Été',
          'Robes d\'été',
          'Activé',
          'Requête large',
          'robe été, mode femme, vêtements',
          'Robes Été Tendance',
          'Mode Femme 2024',
          'Vêtements Stylés',
          'Découvrez notre collection de robes d\'été élégantes et confortables.',
          'Robes modernes pour toutes les occasions. Livraison gratuite.',
          'https://exemple.com/robes-ete',
          'robes',
          'ete',
          'robe été, mode femme',
          'robe hiver',
          'Femmes 25-45',
          'Liens de site, Accroches'
        ],
        [
          'Campagne Mode Été',
          'Chaussures d\'été',
          'Activé',
          'Expression exacte',
          'chaussures été, sandales, mode',
          'Sandales Confort',
          'Chaussures Été',
          'Style Décontracté',
          'Sandales ultra-confortables pour l\'été. Matériaux de qualité.',
          'Marchez avec style et confort toute la journée.',
          'https://exemple.com/chaussures-ete',
          'chaussures',
          'ete',
          'chaussures été, sandales',
          'bottes hiver',
          'Femmes 20-50',
          'Liens de site, Avis clients'
        ]
      ]
    };

    return sampleData;
  }

  /**
   * Obtenir les informations basiques d'un pad
   */
  async getPadInfo(padId: string) {
    if (!this.validatePadId(padId)) {
      throw new Error('ID de pad CryptPad invalide');
    }

    return {
      title: 'Feuille CryptPad - Campagnes',
      type: 'calc' as const,
      owner: 'Vous',
      lastModified: new Date().toISOString()
    };
  }

  /**
   * Créer un nouveau pad (simulation)
   */
  async createPad(name: string): Promise<CryptPadSheet> {
    // Simuler la création d'un nouveau pad
    const padId = btoa(Math.random().toString()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    
    return {
      id: padId,
      name: name,
      url: `https://cryptpad.fr/sheet/#/2/sheet/edit/${padId}`,
      type: 'calc'
    };
  }

  /**
   * Sauvegarder des données dans un pad (simulation)
   */
  async saveSheetData(padId: string, data: string[][]): Promise<boolean> {
    if (!this.validatePadId(padId)) {
      throw new Error('ID de pad CryptPad invalide');
    }

    // Simuler la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stocker localement pour la démo
    localStorage.setItem(`cryptpad_data_${padId}`, JSON.stringify({ values: data }));
    
    return true;
  }
}

export const cryptpadService = new CryptPadService();
