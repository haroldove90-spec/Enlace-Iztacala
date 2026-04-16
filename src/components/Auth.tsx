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
      setError(error.message);
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full editorial-card space-y-8 text-center"
      >
        <div className="flex flex-col items-center">
          <img 
            src="https://appdesignproyectos.com/enlaceiztacala.png" 
            alt="Enlace Iztacala Logo" 
            className="w-32 mb-6"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-3xl font-serif">Bienvenido a la red de Iztacala</h2>
          <p className="mt-2 text-brand-muted text-sm uppercase tracking-widest font-bold">
            Acceso Boutique para Vecinos
          </p>
        </div>

        {!submitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2 text-left">
              <label htmlFor="email" className="text-xs uppercase tracking-wider font-bold text-slate-500 pl-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-4 border border-slate-200 text-brand-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                  placeholder="vecino@ejemplo.com"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold text-white bg-brand-primary hover:bg-brand-accent transition-colors disabled:opacity-50 tracking-widest uppercase"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <span className="flex items-center gap-2">
                    Enviar Enlace Mágico <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-10 space-y-4"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-serif">¡Revisa tu correo!</h3>
            <p className="text-sm text-brand-muted max-w-[280px] mx-auto">
              Hemos enviado un enlace de acceso directo a <strong>{email}</strong>. Haz clic en él para entrar.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:underline pt-4"
            >
              Regresar
            </button>
          </motion.div>
        )}

        <div className="pt-6 text-[10px] text-brand-muted italic">
          Protegiendo la privacidad de los vecinos de Los Reyes.
        </div>
      </motion.div>
    </div>
  );
}
