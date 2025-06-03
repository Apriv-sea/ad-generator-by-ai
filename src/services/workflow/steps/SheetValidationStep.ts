
import { WorkflowStep, SheetValidationInput, SheetValidationOutput, WorkflowContext, ValidationResult } from '../types';
import { sheetService } from '@/services/googleSheetsService';
import { VALIDATED_COLUMNS } from '@/services/googleSheetsService';

export class SheetValidationStep implements WorkflowStep<SheetValidationInput, SheetValidationOutput> {
  id = 'sheet-validation';
  name = 'Validation de la feuille Google Sheets';
  description = 'Vérifie que la feuille existe et contient les colonnes requises';

  validate(input: SheetValidationInput): ValidationResult {
    if (!input.sheetId || typeof input.sheetId !== 'string') {
      return {
        isValid: false,
        errors: ['ID de feuille manquant ou invalide']
      };
    }

    if (input.sheetId.length < 10) {
      return {
        isValid: false,
        errors: ['ID de feuille trop court, vérifiez le format']
      };
    }

    return { isValid: true };
  }

  async execute(input: SheetValidationInput, context: WorkflowContext): Promise<SheetValidationOutput> {
    try {
      console.log('Validation de la feuille:', input.sheetId);

      // Tentative de récupération des données
      const sheetData = await sheetService.getSheetData(input.sheetId);
      
      if (!sheetData || !sheetData.values || sheetData.values.length === 0) {
        return {
          isValid: false,
          hasRequiredColumns: false,
          data: [],
          suggestTemplate: true,
          templateType: 'empty-sheet'
        };
      }

      const data = sheetData.values;
      const headers = data[0] || [];

      // Vérification des colonnes requises
      const hasRequiredColumns = this.checkRequiredColumns(headers);
      
      // Vérification qu'il y a des données au-delà des en-têtes
      const hasData = data.length > 1;

      if (!hasRequiredColumns || !hasData) {
        return {
          isValid: true,
          hasRequiredColumns: false,
          data: data,
          suggestTemplate: true,
          templateType: hasRequiredColumns ? 'missing-data' : 'missing-columns'
        };
      }

      return {
        isValid: true,
        hasRequiredColumns: true,
        data: data,
        suggestTemplate: false
      };

    } catch (error) {
      console.error('Erreur lors de la validation de la feuille:', error);
      
      // Si l'erreur est liée aux permissions ou à l'accès
      if (error.message?.includes('403') || error.message?.includes('permission')) {
        throw new Error('Accès refusé à la feuille. Vérifiez que la feuille est partagée publiquement ou que vous avez les permissions nécessaires.');
      }
      
      if (error.message?.includes('404')) {
        throw new Error('Feuille introuvable. Vérifiez l\'ID de la feuille.');
      }

      throw new Error('Impossible de valider la feuille: ' + error.message);
    }
  }

  private checkRequiredColumns(headers: string[]): boolean {
    // Vérifier qu'au moins quelques colonnes essentielles sont présentes
    const essentialColumns = [
      'Nom de la campagne',
      'Nom du groupe d\'annonces',
      'Top 3 mots-clés'
    ];

    return essentialColumns.some(col => 
      headers.some(header => 
        header && header.toLowerCase().includes(col.toLowerCase())
      )
    );
  }
}
