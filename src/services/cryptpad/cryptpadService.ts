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
      // Format CryptPad URLs: https://cryptpad.fr/sheet/#/2/sheet/edit/...
      const match = url.match(/cryptpad\.fr\/(?:sheet|calc)\/#\/\d+\/(?:sheet|calc)\/(?:edit|view)\/([^\/\?]+)/);
      if (match) {
        return match[1];
      }
      
      // Autre format possible
      const match2 = url.match(/\/sheet\/#\/([^\/\?]+)/);
      if (match2) {
        return match2[1];
      }
      
      return null;
    } catch (error) {
      console.error("Erreur lors de l'extraction de l'ID CryptPad:", error);
      return null;
    }
  }

  /**
   * Valider qu'un ID CryptPad est au bon format
   */
  validatePadId(padId: string): boolean {
    return /^[a-zA-Z0-9+\/=\-_]+$/.test(padId) && padId.length > 10;
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
   * Récupérer les données depuis CryptPad - VERSION CORRIGEE
   */
  async getSheetData(padId: string): Promise<CryptPadData> {
    if (!this.validatePadId(padId)) {
      throw new Error('ID de pad CryptPad invalide');
    }

    console.log("📡 Tentative de récupération des données CryptPad pour:", padId);

    try {
      // Vérifier d'abord si des données existent localement (cache)
      const localData = localStorage.getItem(`cryptpad_data_${padId}`);
      if (localData) {
        console.log("💾 Données trouvées en cache local");
        return JSON.parse(localData);
      }

      // Construire l'URL d'export CSV de CryptPad
      const exportUrl = `https://cryptpad.fr/sheet/#/2/sheet/export/csv/${padId}`;
      
      console.log("🔗 URL d'export construite:", exportUrl);

      // Simuler un délai pour UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TEMPORAIRE: Pour le développement, on va utiliser une approche différente
      // En attendant l'implémentation complète de l'API CryptPad
      
      console.warn("⚠️ Mode développement: utilisation de données simulées");
      console.log("🔧 Pour une intégration complète, il faudrait:");
      console.log("1. Utiliser l'API CryptPad officielle");
      console.log("2. Ou implémenter un proxy côté serveur");
      console.log("3. Ou utiliser l'export CSV direct");

      // Pour l'instant, retourner une structure vide que l'utilisateur peut remplir
      const emptyData: CryptPadData = {
        title: 'Feuille CryptPad - Vide',
        values: [
          this.getStandardHeaders(),
          // Ligne vide pour que l'utilisateur puisse tester
          new Array(this.getStandardHeaders().length).fill('')
        ]
      };

      // Informer l'utilisateur
      console.log("ℹ️ Données vides retournées - l'utilisateur doit saisir ses données");
      
      return emptyData;

    } catch (error) {
      console.error("❌ Erreur lors de la récupération CryptPad:", error);
      
      // En cas d'erreur, retourner une structure vide
      return {
        title: 'Erreur - Feuille vide',
        values: [
          this.getStandardHeaders()
        ]
      };
    }
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
