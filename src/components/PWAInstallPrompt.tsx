import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevenir que el navegador muestre el prompt automático
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      setDeferredPrompt(e);
      
      // Mostrar nuestro popup después de un pequeño retraso
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Permitir activación manual desde el sidebar
    const showHandler = () => setIsVisible(true);
    window.addEventListener('show-pwa-prompt', showHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('show-pwa-prompt', showHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Para instalar en este dispositivo: \n1. Da clic en el botón Compartir o Ajustes del navegador.\n2. Selecciona 'Agregar a inicio' o 'Instalar App'.");
      return;
    }
    
    setIsVisible(false);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Guardar en localStorage para no molestar de nuevo en esta sesión/dispositivo
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-12 md:max-w-sm bg-brand-ink text-white p-6 rounded-[2.5rem] shadow-2xl z-[100] border border-white/10 backdrop-blur-xl"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex gap-5 items-center mb-4">
            <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg leading-tight">Instalar Aplicación</h3>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Enlace Iztacala</p>
            </div>
          </div>
          
          <p className="text-xs text-white/70 leading-relaxed mb-6 italic">
            Agrega Enlace Iztacala a tu pantalla de inicio para un acceso rápido y seguro, como una App nativa.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              className="flex-1 py-3 bg-brand-primary hover:bg-brand-accent transition-all text-white rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Smartphone size={16} /> Instalar Ahora
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
