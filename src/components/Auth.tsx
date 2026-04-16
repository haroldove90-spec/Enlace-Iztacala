import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Loader2, ArrowRight, User, Lock, Calendar, AtSign, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRegister) {
      // Registro
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username.toLowerCase().replace(/\s/g, ''),
            dob: dob,
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Supabase suele disparar un trigger para crear el perfil, 
      // pero si el usuario acaba de registrarse y no queremos link de confirmación,
      // esto depende de la config del proyecto. 
      // Si el login es exitoso aquí (porque auto-confirm está on), pasará solo.
      if (authData.user && !authData.session) {
        setError("Cuenta creada. Por favor inicia sesión.");
        setIsRegister(false);
      }
    } else {
      // Login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] rounded-[2.5rem] px-6 py-12 md:px-12 md:py-16 text-center"
      >
        <div className="mb-10 text-center">
          <img 
            src="https://appdesignproyectos.com/enlaceiztacala.png" 
            alt="Enlace Iztacala" 
            className="w-16 mx-auto mb-6 grayscale hover:grayscale-0 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl md:text-3xl font-serif text-slate-900 tracking-tight leading-none mb-3 uppercase">
            {isRegister ? 'Únete al Vecindario' : 'Bienvenido de nuevo'}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">
            Portal Comunitario Los Reyes
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <AnimatePresence mode="popLayout">
            {isRegister && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div className="relative group">
                  <User className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-700 transition-colors" size={18} />
                  <input
                    type="text"
                    required={isRegister}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-8 pr-0 py-3 bg-transparent border-b border-slate-100 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-sky-700 transition-all text-sm font-light"
                    placeholder="Nombre Completo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <AtSign className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-700 transition-colors" size={18} />
                    <input
                      type="text"
                      required={isRegister}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-8 pr-0 py-3 bg-transparent border-b border-slate-100 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-sky-700 transition-all text-sm font-light"
                      placeholder="Usuario"
                    />
                  </div>
                  <div className="relative group">
                    <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-700 transition-colors" size={18} />
                    <input
                      type="date"
                      required={isRegister}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="block w-full pl-8 pr-0 py-3 bg-transparent border-b border-slate-100 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-sky-700 transition-all text-sm font-light"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-700 transition-colors" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-8 pr-0 py-3 bg-transparent border-b border-slate-100 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-sky-700 transition-all text-sm font-light"
              placeholder="tu@correo.com"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-700 transition-colors" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-8 pr-0 py-3 bg-transparent border-b border-slate-100 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-sky-700 transition-all text-sm font-light"
              placeholder="Contraseña"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-red-500 font-medium bg-red-50 p-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 hover:bg-sky-900 transition-all text-white font-bold text-[10px] tracking-[0.3em] uppercase rounded-full shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3 mt-8"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>{isRegister ? 'Registrarme' : 'Entrar ahora'} <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-sky-700 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {isRegister ? (
              <><ArrowLeft size={12} /> Ya tengo cuenta</>
            ) : (
              <>¿No eres miembro? Regístrate <ArrowRight size={12} /></>
            )}
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-50">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300 font-semibold text-center">
            Privacidad & Exclusividad • Nexo Reyes
          </p>
        </div>
      </motion.div>
    </div>
  );
}
