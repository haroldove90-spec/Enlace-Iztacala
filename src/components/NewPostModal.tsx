import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MapPin, Tag, Loader2 } from 'lucide-react';
import { createPost, createIncident } from '../lib/supabase-hooks';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'post' | 'incident';
}

export default function NewItemModal({ isOpen, onClose, userId, type }: NewItemModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(''); // Solo para incidentes
  const [category, setCategory] = useState('Social');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'post') {
        await createPost(content, category, userId);
      } else {
        await createIncident(title, content, location, userId);
      }
      
      // Limpiar y cerrar
      setContent('');
      setTitle('');
      setLocation('');
      onClose();
    } catch (error) {
      console.error('Error al publicar:', error);
      alert('Hubo un error al publicar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-[2.5rem] shadow-2xl z-[110] overflow-hidden border border-slate-100"
          >
            <div className="p-8 md:p-10">
              <header className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif">
                  {type === 'post' ? 'Nueva Publicación' : 'Reportar Incidente'}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                {type === 'incident' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Título del Reporte</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Fuga de agua, Luminaria fundida..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                    />
                  </div>
                )}

                {type === 'post' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Categoría</label>
                    <div className="flex flex-wrap gap-2">
                      {['Social', 'Seguridad', 'Comercio', 'Avisos'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                            category === cat 
                              ? 'bg-brand-primary text-white' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    {type === 'post' ? '¿Qué quieres compartir?' : 'Descripción detallada'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={type === 'post' ? "Escribe aquí tu mensaje para los vecinos..." : "Describe el problema para que el ayuntamiento o vecinos puedan identificarlo..."}
                    className="w-full bg-slate-50 border-none rounded-[2rem] px-6 py-5 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
                    <MapPin size={12} /> Ubicación (Opcional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Calle de los Reyes #4, Frente al parque..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-brand-ink hover:bg-black text-white rounded-full font-bold text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>Publicar Ahora <Send size={14} /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
