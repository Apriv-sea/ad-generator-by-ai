import { GoogleSheetsAuthService } from './googleSheetsAuthService';
import { GoogleSheetsErrorHandler } from './googleSheetsErrorHandler';

export interface SheetData {
  values: string[][];
  range?: string;
  majorDimension?: string;
  title?: string;
  rangeUsed?: string;
}

export class GoogleSheetsApiService {
  private static readonly API_BASE_URL = 'https://lbmfkppvzimklebisefm.supabase.co/functions/v1/google-sheets-api';

  static extractSheetId(url: string): string | null {
    console.log('🔍 Extraction d\'ID depuis l\'URL:', url);
    
    if (!url || typeof url !== 'string') {
      console.log('❌ URL invalide ou vide');
      return null;
    }

    // Nettoyer l'URL de manière plus agressive
    let cleanUrl = url.trim();
    
    // Supprimer les fragments (#) et paramètres de requête (?) mais garder le chemin principal
    cleanUrl = cleanUrl.split('#')[0].split('?')[0];
    
    // Supprimer les espaces et caractères spéciaux en début/fin
    cleanUrl = cleanUrl.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
    
    console.log('🔍 URL nettoyée:', cleanUrl);
    
    // Patterns d'extraction d'ID de feuille Google (du plus spécifique au plus général)
    const patterns = [
      // Pattern principal pour les URLs Google Sheets standard
      /(?:docs\.google\.com|sheets\.google\.com)\/spreadsheets\/d\/([a-zA-Z0-9-_]{25,})/,
      // Pattern pour les URLs avec /u/0/ ou /u/1/
      /\/u\/\d+\/spreadsheets\/d\/([a-zA-Z0-9-_]{25,})/,
      // Pattern pour les IDs directs (très long, caractéristique de Google)
      /^([a-zA-Z0-9-_]{25,})$/,
      // Pattern de fallback plus permissif
      /\/d\/([a-zA-Z0-9-_]{20,})/,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        const extractedId = match[1];
        console.log(`✅ ID extrait avec pattern ${i + 1}:`, extractedId);
        
        // Validation basique de l'ID extrait
        if (extractedId.length >= 20 && /^[a-zA-Z0-9-_]+$/.test(extractedId)) {
          return extractedId;
        } else {
          console.log(`⚠️ ID extrait invalide (trop court ou caractères invalides):`, extractedId);
        }
      }
    }

    // Essayer avec l'URL originale au cas où le nettoyage aurait supprimé quelque chose d'important
    if (cleanUrl !== url) {
      console.log('🔄 Tentative avec URL originale:', url);
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = url.match(pattern);
        if (match && match[1]) {
          const extractedId = match[1];
          console.log(`✅ ID extrait avec URL originale (pattern ${i + 1}):`, extractedId);
          
          if (extractedId.length >= 20 && /^[a-zA-Z0-9-_]+$/.test(extractedId)) {
            return extractedId;
          }
        }
      }
    }

    console.log('❌ Impossible d\'extraire l\'ID depuis l\'URL');
    console.log('❌ URL testée:', cleanUrl);
    console.log('❌ URL originale:', url);
    return null;
  }

  static validateSheetId(sheetId: string): boolean {
    if (!sheetId || typeof sheetId !== 'string') {
      console.log('❌ Validation ID: ID vide ou non-string');
      return false;
    }
    
    // Un ID Google Sheets valide doit faire au moins 20 caractères et contenir uniquement des caractères alphanumériques, tirets et underscores
    const isValid = sheetId.length >= 20 && /^[a-zA-Z0-9-_]+$/.test(sheetId);
    console.log(`🔍 Validation ID "${sheetId}":`, isValid ? '✅ Valide' : '❌ Invalide');
    return isValid;
  }

  static async getSheetData(sheetId: string, range: string = 'A1:AZ1000'): Promise<SheetData> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    if (!GoogleSheetsAuthService.isAuthenticated()) {
      throw new Error('Authentification Google Sheets requise');
    }

    try {
      console.log(`📖 === DEBUT LECTURE GOOGLE SHEETS ===`);
      console.log(`📋 Feuille: ${sheetId}`);
      console.log(`📊 Range demandé: ${range}`);
      
      // Récupérer le token d'authentification
      const authHeaders = GoogleSheetsAuthService.getAuthHeaders();
      console.log('🔐 Headers d\'authentification:', {
        hasAuthorization: !!authHeaders['Authorization'],
        authType: authHeaders['Authorization']?.split(' ')[0] || 'N/A',
        tokenPrefix: authHeaders['Authorization']?.substring(0, 30) + '...' || 'N/A'
      });
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'read',
          sheetId,
          range
        })
      });

      console.log(`📡 Réponse API lecture:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erreur API lecture (${response.status}):`, errorText);
        
        // Analyser les erreurs spécifiques
        if (response.status === 403) {
          console.error('🚫 Erreur 403 - Accès refusé. Vérifiez les permissions de la feuille.');
        } else if (response.status === 404) {
          console.error('📋 Erreur 404 - Feuille introuvable. Vérifiez l\'ID.');
        } else if (response.status === 401) {
          console.error('🔐 Erreur 401 - Token d\'authentification invalide ou expiré.');
          // Nettoyer les tokens invalides
          GoogleSheetsAuthService.clearTokens();
          throw new Error('Token d\'authentification expiré. Veuillez vous reconnecter.');
        }
        
        // Tenter de parser en JSON, sinon traiter comme erreur HTML
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw { status: response.status, message: `Erreur HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw { status: response.status, ...errorData };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Réponse non-JSON reçue:', responseText.substring(0, 200));
        throw new Error('Réponse non-JSON reçue du serveur');
      }

      const data = await response.json();
      
      console.log('✅ === DONNEES REÇUES GOOGLE SHEETS ===');
      console.log('📊 Données brutes:', {
        hasValues: !!data.values,
        valuesType: typeof data.values,
        valuesIsArray: Array.isArray(data.values),
        totalRows: data.values?.length || 0,
        range: data.range,
        majorDimension: data.majorDimension,
        title: data.title,
        rangeUsed: data.rangeUsed
      });

      if (data.values && Array.isArray(data.values)) {
        console.log('📋 Détail des lignes reçues:');
        data.values.forEach((row, index) => {
          console.log(`  Ligne ${index + 1}:`, {
            length: row?.length || 0,
            content: row?.slice(0, 5), // Première 5 colonnes
            isEmpty: !row || row.every(cell => !cell || cell.toString().trim() === ''),
            fullRow: row
          });
        });

        // Vérifier s'il y a des lignes vides qui pourraient être ignorées
        const nonEmptyRows = data.values.filter(row => 
          row && row.some(cell => cell && cell.toString().trim() !== '')
        );
        
        console.log(`📊 Analyse des lignes:`, {
          totalRowsReceived: data.values.length,
          nonEmptyRows: nonEmptyRows.length,
          emptyRowsFiltered: data.values.length - nonEmptyRows.length
        });
      }

      return {
        values: data.values || [],
        range: data.range,
        majorDimension: data.majorDimension,
        title: data.title || 'Feuille Google Sheets',
        rangeUsed: data.rangeUsed || range
      };

    } catch (error) {
      const handledError = GoogleSheetsErrorHandler.handleApiError(error);
      console.error('❌ === ERREUR COMPLETE LECTURE ===');
      console.error('Message:', handledError.message);
      console.error('Erreur originale:', error);
      throw new Error(handledError.message);
    }
  }

  static async saveSheetData(sheetId: string, data: string[][], range: string = 'A1'): Promise<boolean> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    if (!GoogleSheetsAuthService.isAuthenticated()) {
      throw new Error('Authentification Google Sheets requise');
    }

    try {
      console.log(`✍️ === DEBUT SAUVEGARDE GOOGLE SHEETS ===`);
      console.log(`📋 Feuille cible: ${sheetId}`);
      console.log(`📊 Données à sauvegarder:`, {
        totalRows: data.length,
        totalCols: data[0]?.length || 0,
        range: range,
        firstRow: data[0],
        dataPreview: data.slice(0, 3)
      });
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          ...GoogleSheetsAuthService.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'write',
          sheetId,
          data,
          range,
          valueInputOption: 'RAW' // S'assurer que les données sont écrites telles quelles
        })
      });

      console.log(`📡 Réponse API sauvegarde:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log(`📄 Contenu réponse sauvegarde:`, responseText);

      if (!response.ok) {
        console.error(`❌ === ERREUR SAUVEGARDE DETAILLEE ===`);
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.error('Contenu:', responseText);

        // Analyser les erreurs courantes de sauvegarde
        if (response.status === 403) {
          console.error('🚫 Erreur 403 - Problèmes possibles:');
          console.error('- Permissions insuffisantes sur la feuille Google Sheets');
          console.error('- Token expiré ou invalide');
          console.error('- Feuille protégée en écriture');
        }
        
        if (response.status === 400) {
          console.error('📝 Erreur 400 - Problème de données:');
          console.error('- Format de données invalide');
          console.error('- Range invalide');
          console.error('- Taille de données trop importante');
        }

        // Essayer de parser la réponse d'erreur
        let errorMessage = `Erreur sauvegarde (${response.status}): ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('📋 Détails de l\'erreur parsée:', errorData);
        } catch (parseError) {
          console.error('❌ Impossible de parser la réponse d\'erreur:', parseError);
        }

        throw { status: response.status, message: errorMessage };
      }

      // Parser la réponse de succès
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('✅ Réponse sauvegarde parsée:', result);
      } catch (parseError) {
        console.warn('⚠️ Réponse non-JSON mais succès HTTP:', responseText);
        // Si c'est un succès HTTP mais pas JSON, on considère que c'est OK
        result = { success: true };
      }

      // Vérifier que la sauvegarde a bien été effectuée
      if (result && (result.updatedCells || result.updatedRows || result.success !== false)) {
        console.log('✅ === SAUVEGARDE REUSSIE ===');
        console.log('Détails:', {
          updatedCells: result.updatedCells,
          updatedRows: result.updatedRows,
          updatedColumns: result.updatedColumns,
          spreadsheetId: result.spreadsheetId
        });
        return true;
      } else {
        console.warn('⚠️ Sauvegarde incertaine - pas de confirmation:', result);
        return true; // On assume que c'est OK si pas d'erreur HTTP
      }

    } catch (error) {
      console.error('❌ === ERREUR COMPLETE SAUVEGARDE ===');
      console.error('Type:', error.constructor.name);
      console.error('Message:', error.message || error);
      console.error('Stack:', error.stack);
      
      const handledError = GoogleSheetsErrorHandler.handleApiError(error);
      console.error('❌ Erreur sauvegarde gérée:', handledError);
      throw new Error(handledError.message);
    }
  }

  static createNewSheetUrl(): string {
    return 'https://docs.google.com/spreadsheets/create';
  }
}
