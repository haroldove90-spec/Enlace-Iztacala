import React from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Video, Send, MapPin, Smile } from 'lucide-react';
import type { Profile } from '../types';

interface QuickPostFormProps {
  onOpenModal: () => void;
  userProfile?: Profile;
}

export default function QuickPostForm({ onOpenModal, userProfile }: QuickPostFormProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="editorial-card mb-10 overflow-hidden !py-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/50"
    >
      <div className="flex gap-4 items-start mb-6">
        <div className="w-14 h-14 rounded-[1.8rem] overflow-hidden bg-slate-100 border-2 border-white shadow-sm shrink-0">
          <img 
            src={userProfile?.avatar_url || `https://picsum.photos/seed/${userProfile?.id}/100/100`} 
            alt="My Avatar"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <button 
          onClick={onOpenModal}
          className="flex-1 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-[1.5rem] px-8 py-5 text-left text-slate-400 text-sm font-serif italic border border-slate-50"
        >
          ¿Qué está pasando en el vecindario, {userProfile?.full_name?.split(' ')[0] || 'Vecino'}?
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-6 px-2">
        <div className="flex gap-4 md:gap-8">
          <button 
            onClick={onOpenModal}
            className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors group"
          >
            <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-brand-primary/10 transition-colors">
              <ImageIcon size={16} className="text-brand-primary" />
            </div>
            <span className="hidden sm:inline">Foto</span>
          </button>
          
          <button 
            onClick={onOpenModal}
            className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors group"
          >
            <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-brand-primary/10 transition-colors">
              <Video size={16} className="text-brand-primary" />
            </div>
            <span className="hidden sm:inline">Video</span>
          </button>

          <button 
            onClick={onOpenModal}
            className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors group"
          >
            <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-brand-primary/10 transition-colors">
              <MapPin size={16} className="text-brand-primary" />
            </div>
            <span className="hidden sm:inline">Lugar</span>
          </button>
        </div>

        <button 
          onClick={onOpenModal}
          className="bg-brand-ink hover:bg-black text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-lg shadow-slate-200 active:scale-95"
        >
          Publicar <Send size={14} />
        </button>
      </div>
    </motion.div>
  );
}
