import React from 'react';
import { motion } from 'motion/react';
import { Megaphone, ExternalLink } from 'lucide-react';
import { useSiteBanners } from '../lib/supabase-hooks';

export default function HeaderBanner() {
  const { banners, loading } = useSiteBanners();

  if (loading || banners.length === 0) return null;

  const activeBanner = banners[0];

  return (
    <div className="w-full mb-8">
      <a 
        href={activeBanner.link_url || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block group relative overflow-hidden rounded-[2.5rem] bg-slate-100 border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-brand-primary/20 aspect-[21/9] md:aspect-[5/1]"
      >
        <img 
          src={activeBanner.image_url} 
          alt={activeBanner.title || 'Anuncio'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 md:p-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-end w-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Publicidad</span>
                {activeBanner.title && (
                  <h4 className="text-white font-serif text-lg md:text-xl italic">{activeBanner.title}</h4>
                )}
              </div>
            </div>
            {activeBanner.link_url && (
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                <ExternalLink size={20} />
              </div>
            )}
          </div>
        </div>

        {/* Tag siempre visible */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-white/80 backdrop-blur-sm text-brand-ink text-[9px] font-black uppercase tracking-[0.2em] rounded-full border-whiteShadow shadow-sm z-10 flex items-center gap-2">
          <Megaphone size={12} className="text-brand-primary" /> Espacio Reservado
        </div>
      </a>
    </div>
  );
}
