
/**
 * Service dédié uniquement à l'extraction d'ID depuis les URLs Google Sheets
 * Approche simplifiée et robuste
 */
export class GoogleSheetsUrlParser {
  /**
   * Extraction d'ID Google Sheets avec approche ultra-robuste
   */
  static extractSheetId(url: string): { id: string | null; debugInfo: any } {
    const debugInfo = {
      originalUrl: url,
      urlType: typeof url,
      urlLength: url?.length || 0,
      steps: []
    };

    console.log('🔍 === DEBUT EXTRACTION ID ULTRA-ROBUSTE ===');
    console.log('URL originale:', url);
    
    // Étape 1: Validation de base
    if (!url || typeof url !== 'string') {
      debugInfo.steps.push('ERREUR: URL invalide ou vide');
      console.log('❌ URL invalide:', { url, type: typeof url });
      return { id: null, debugInfo };
    }

    // Étape 2: Nettoyage ultra-agressif
    let cleanUrl = url.trim();
    
    // Supprimer tous les caractères invisibles
    cleanUrl = cleanUrl.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
    
    // Supprimer tout après # ou ?
    cleanUrl = cleanUrl.split('#')[0].split('?')[0];
    
    // Supprimer les espaces en début/fin
    cleanUrl = cleanUrl.trim();
    
    debugInfo.steps.push(`Nettoyage: "${cleanUrl}"`);
    console.log('🧹 URL nettoyée:', cleanUrl);

    // Étape 3: Vérification domaine Google
    const isGoogleSheets = cleanUrl.includes('docs.google.com/spreadsheets') || 
                          cleanUrl.includes('sheets.google.com');
    
    if (!isGoogleSheets) {
      debugInfo.steps.push('ERREUR: Pas une URL Google Sheets');
      console.log('❌ Pas une URL Google Sheets');
      return { id: null, debugInfo };
    }

    // Étape 4: Extraction par patterns multiples (du plus spécifique au plus général)
    const extractionPatterns = [
      {
        name: 'Pattern standard /d/',
        regex: /\/spreadsheets\/d\/([a-zA-Z0-9-_]{25,})/,
        description: 'Pattern principal Google Sheets'
      },
      {
        name: 'Pattern avec user /u/',
        regex: /\/u\/\d+\/spreadsheets\/d\/([a-zA-Z0-9-_]{25,})/,
        description: 'URL avec utilisateur spécifique'
      },
      {
        name: 'Pattern simple /d/',
        regex: /\/d\/([a-zA-Z0-9-_]{20,})/,
        description: 'Pattern générique'
      },
      {
        name: 'Pattern très permissif',
        regex: /([a-zA-Z0-9-_]{44})/,
        description: 'ID Google typique (44 caractères)'
      }
    ];

    for (const pattern of extractionPatterns) {
      console.log(`🔍 Test pattern: ${pattern.name}`);
      debugInfo.steps.push(`Test pattern: ${pattern.name}`);
      
      const match = cleanUrl.match(pattern.regex);
      if (match && match[1]) {
        const extractedId = match[1];
        console.log(`✅ ID trouvé avec ${pattern.name}:`, extractedId);
        
        // Validation finale de l'ID
        if (this.validateGoogleSheetId(extractedId)) {
          debugInfo.steps.push(`SUCCÈS: ID valide trouvé avec ${pattern.name}`);
          console.log('✅ === ID EXTRAIT AVEC SUCCÈS ===');
          return { id: extractedId, debugInfo };
        } else {
          debugInfo.steps.push(`ID trouvé mais invalide: ${extractedId}`);
          console.log(`⚠️ ID trouvé mais invalide:`, extractedId);
        }
      }
    }

    // Étape 5: Tentative d'extraction manuelle par découpage
    console.log('🔄 Tentative extraction manuelle...');
    const urlParts = cleanUrl.split('/');
    const dIndex = urlParts.indexOf('d');
    
    if (dIndex !== -1 && dIndex < urlParts.length - 1) {
      const possibleId = urlParts[dIndex + 1];
      console.log('🔍 ID potentiel trouvé par découpage:', possibleId);
      
      if (this.validateGoogleSheetId(possibleId)) {
        debugInfo.steps.push('SUCCÈS: ID valide trouvé par découpage manuel');
        console.log('✅ === ID EXTRAIT PAR DÉCOUPAGE ===');
        return { id: possibleId, debugInfo };
      }
    }

    // Échec complet
    debugInfo.steps.push('ÉCHEC: Aucun ID valide trouvé');
    console.log('❌ === ÉCHEC EXTRACTION COMPLÈTE ===');
    console.log('URL analysée:', cleanUrl);
    console.log('Patterns testés:', extractionPatterns.length);
    
    return { id: null, debugInfo };
  }

  /**
   * Validation stricte d'un ID Google Sheets
   */
  private static validateGoogleSheetId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Un ID Google Sheets fait généralement entre 20 et 50 caractères
    // et contient uniquement des caractères alphanumériques, tirets et underscores
    const isValidLength = id.length >= 20 && id.length <= 50;
    const isValidFormat = /^[a-zA-Z0-9-_]+$/.test(id);
    
    console.log(`🔍 Validation ID "${id}":`, {
      length: id.length,
      isValidLength,
      isValidFormat,
      isValid: isValidLength && isValidFormat
    });
    
    return isValidLength && isValidFormat;
  }

  /**
   * Méthode utilitaire pour tester une URL
   */
  static testUrl(url: string): void {
    console.log('🧪 === TEST URL ===');
    const result = this.extractSheetId(url);
    console.log('Résultat:', result);
    console.log('Debug Info:', result.debugInfo);
  }
}
