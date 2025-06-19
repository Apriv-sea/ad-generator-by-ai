
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
   * Simuler la récupération de données depuis CryptPad
   * Dans une vraie implémentation, ceci ferait un appel API
   */
  async getSheetData(padId: string): Promise<CryptPadData> {
    if (!this.validatePadId(padId)) {
      throw new Error('ID de pad CryptPad invalide');
    }

    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Données d'exemple pour la démo
    const sampleData: CryptPadData = {
      title: 'Feuille CryptPad - Campagnes',
      values: [
        [
          'Nom de la campagne',
          'Nom du groupe d\'annonces', 
          'Top 3 mots-clés',
          'Titre 1',
          'Titre 2',
          'Titre 3',
          'Description 1',
          'Description 2'
        ],
        [
          'Campagne Mode Été',
          'Robes d\'été',
          'robe été, mode femme, vêtements',
          'Robes Été Tendance',
          'Mode Femme 2024',
          'Vêtements Stylés',
          'Découvrez notre collection de robes d\'été élégantes et confortables.',
          'Robes modernes pour toutes les occasions. Livraison gratuite.'
        ],
        [
          'Campagne Mode Été',
          'Chaussures d\'été',
          'chaussures été, sandales, mode',
          'Sandales Confort',
          'Chaussures Été',
          'Style Décontracté',
          'Sandales ultra-confortables pour l\'été. Matériaux de qualité.',
          'Marchez avec style et confort toute la journée.'
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
