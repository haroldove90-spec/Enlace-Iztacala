import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-3xl p-12 text-center"
      >
        <div className="mb-12">
          <img 
            src="https://appdesignproyectos.com/enlaceiztacala.png" 
            alt="Enlace Iztacala" 
            className="w-20 mx-auto mb-8 grayscale opacity-90"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-4xl font-serif text-slate-900 tracking-tight leading-none mb-4">
            Bienvenido
          </h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">
            Portal Comunitario Los Reyes
          </p>
        </div>

        {!submitted ? (
          <form className="space-y-10" onSubmit={handleLogin}>
            <div className="relative group">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-0 py-4 bg-transparent border-b border-slate-100 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-all text-lg text-center font-light"
                placeholder="tu@correo.com"
              />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-900 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-center" />
            </div>

            {error && (
              <p className="text-[11px] text-red-500 font-medium animate-pulse">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 hover:bg-black transition-all text-white font-bold text-[10px] tracking-[0.3em] uppercase rounded-full shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" size={16} />
              ) : (
                "Solicitar Enlace de Acceso"
              )}
            </button>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-6 space-y-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-900 mb-2">
              <Mail size={32} strokeWidth={1.5} />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-serif text-slate-900">Verifica tu buzón</h3>
              <p className="text-sm text-slate-500 font-light leading-relaxed max-w-[280px] mx-auto">
                Hemos enviado un enlace mágico a <strong>{email}</strong> para que entres sin contraseña.
              </p>
            </div>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
            >
              ¿No llegó? Intentar con otro correo
            </button>
          </motion.div>
        )}

        <div className="mt-16 pt-8 border-t border-slate-50">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300 font-semibold">
            Privacidad & Exclusividad • Los Reyes Iztacala I
          </p>
        </div>
      </motion.div>
    </div>
  );
}
