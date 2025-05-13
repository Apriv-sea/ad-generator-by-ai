
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Ajoutez ce style global pour le tableur amélioré
export const addTableStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.id = 'handsontable-custom-styles';
  styleElement.innerHTML = `
    .hot-improved .handsontable {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      font-size: 14px;
    }
    
    .hot-improved .handsontable .header-cell {
      background-color: #f8f9fa;
      font-weight: 600;
      text-align: center;
    }
    
    .hot-improved .handsontable th {
      background-color: #f8f9fa;
      color: #374151;
      font-weight: 600;
      border-color: #e5e7eb;
    }
    
    .hot-improved .handsontable td {
      border-color: #e5e7eb;
      padding: 4px 8px;
    }
    
    .hot-improved .handsontable tr:first-child td {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    
    .hot-improved .handsontable .current {
      background-color: rgba(37, 99, 235, 0.1) !important;
    }
    
    .hot-improved .handsontable .area.area-current {
      background-color: rgba(37, 99, 235, 0.2) !important;
    }
    
    .htDropdownMenu .ht_master .wtHolder {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .hot-improved .handsontable tr:hover td {
      background-color: rgba(0, 0, 0, 0.02);
    }
    
    .hot-improved .handsontable .htCommentCell:after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      border-width: 0 8px 8px 0;
      border-style: solid;
      border-color: transparent #ffbf00 transparent transparent;
    }
  `;
  
  // Supprime le style existant s'il existe
  const existingStyle = document.getElementById('handsontable-custom-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.head.appendChild(styleElement);
}

