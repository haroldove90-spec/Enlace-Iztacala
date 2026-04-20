import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MapPin, Tag, Loader2, Image as ImageIcon, Video, Paperclip } from 'lucide-react';
import { createPost, createIncident, uploadFile } from '../lib/supabase-hooks';
import { toast } from 'react-hot-toast';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'post' | 'incident';
}

export default function NewPostModal({ isOpen, onClose, userId, type, userRole }: NewItemModalProps & { userRole?: string }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(''); // Solo para incidentes
  const [category, setCategory] = useState((userRole === 'Business' || userRole === 'Negocio') ? 'Comercio' : 'Social');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validar tamaño/tipo si es necesario
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileUrl = '';
      if (selectedFile) {
        const loadingToast = toast.loading('Subiendo multimedia...');
        try {
          fileUrl = await uploadFile('post-assets', selectedFile, userId);
          toast.success('Archivo listo', { id: loadingToast });
        } catch (uploadErr) {
          toast.error('Error al subir archivo. Verifica el bucket "post-assets".', { id: loadingToast });
          throw uploadErr;
        }
      }

      if (type === 'post') {
        await createPost(content, category, userId, fileUrl);
        toast.success('Publicado con éxito');
      } else {
        await createIncident(title, content, location, userId, fileUrl);
        toast.success('Incidente reportado');
      }
      
      // Limpiar y cerrar
      setContent('');
      setTitle('');
      setLocation('');
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Error al publicar:', error);
      // El error de subida ya se notificó arriba
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
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:top-[8%] md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:max-w-lg w-full bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl z-[110] overflow-hidden border border-slate-100 flex flex-col"
          >
            <div className="p-6 md:p-10 overflow-y-auto flex-1">
              <header className="flex justify-between items-center mb-6 md:mb-8">
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
                    <Paperclip size={12} /> Multimedia
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <input 
                      type="file" 
                      hidden 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                    />
                    {selectedFile ? (
                      <p className="text-sm font-medium text-brand-primary truncate max-w-full">
                        {selectedFile.name}
                      </p>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <ImageIcon size={20} className="text-slate-300" />
                          <Video size={20} className="text-slate-300" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Click para subir foto o video</p>
                      </>
                    )}
                  </div>
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
