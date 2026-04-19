import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('DOM cargado, iniciando React...');

try {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('No se encontró el elemento root en el DOM');
  }
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('React montado correctamente.');

  // Registrar Service Worker para PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrado corectamente:', reg.scope))
        .catch(err => console.error('Falla al registrar SW:', err));
    });
  }
} catch (error) {
  console.error('Error durante el montaje de React:', error);
  if (typeof window.onerror === 'function') {
    window.onerror('Falla al montar React: ' + error, '', 0, 0, error as Error);
  }
}
