import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message.includes('JSON')) {
        setError('Error de conexión: No se pudo contactar con la base de datos. Verifica tu conexión o las llaves de acceso en la configuración.');
      } else {
        setError(error.message);
      }
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full editorial-card space-y-12 text-center py-16"
      >
        <div className="flex flex-col items-center">
          <img 
            src="https://appdesignproyectos.com/enlaceiztacala.png" 
            alt="Enlace Iztacala Logo" 
            className="w-24 mb-10"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-3xl font-serif tracking-tight">Enlace Iztacala</h2>
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">
            Red Comunitaria Boutique
          </p>
        </div>

        {!submitted ? (
          <form className="space-y-8" onSubmit={handleLogin}>
            <div className="text-left">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-0 py-3 bg-transparent border-b border-slate-200 text-brand-ink placeholder-slate-300 focus:outline-none focus:border-brand-primary transition-all text-base text-center"
                placeholder="Ingresa tu correo"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-500 font-medium">
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand-primary hover:bg-brand-accent transition-all text-white font-bold text-xs tracking-[0.2em] uppercase disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin mx-auto" size={16} />
                ) : (
                  "Solicitar Acceso"
                )}
              </button>
            </div>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-brand-primary">
              <Mail size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif">Revisa tu correo</h3>
              <p className="text-xs text-brand-muted leading-relaxed max-w-[200px] mx-auto">
                Enviamos un enlace de acceso a <strong>{email}</strong>.
              </p>
            </div>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
            >
              Volver a intentar
            </button>
          </motion.div>
        )}

        <div className="text-[9px] uppercase tracking-widest text-slate-300 font-bold">
          Acceso Exclusivo para Vecinos
        </div>
      </motion.div>
    </div>
  );
}
