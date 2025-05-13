
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ajout des classes Tailwind pour les icônes lucide inline
const style = document.createElement('style')
style.innerHTML = `
  .i-lucide-alert-circle {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: contain;
    display: inline-block;
  }
`
document.head.appendChild(style)

createRoot(document.getElementById("root")!).render(<App />);
