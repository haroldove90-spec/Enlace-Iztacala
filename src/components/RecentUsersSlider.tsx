import React from 'react';
import { motion } from 'motion/react';
import { useRecentUsers } from '../lib/supabase-hooks';
import { Sparkles } from 'lucide-react';

export default function RecentUsersSlider() {
  const { users, loading } = useRecentUsers();

  if (loading || users.length === 0) return null;

  return (
    <div className="w-full mb-10 overflow-hidden">
      <div className="flex items-center gap-3 mb-6 px-4">
        <div className="p-2 bg-brand-primary/10 rounded-xl">
          <Sparkles size={16} className="text-brand-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-brand-ink uppercase tracking-wider">Nuevos Vecinos</h3>
          <p className="text-[10px] text-slate-400 font-medium uppercase font-sans tracking-tight">Recién llegados a la red</p>
        </div>
      </div>

      <div className="relative group">
        {/* Desvanecidos laterales */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none md:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none md:hidden" />

        <div className="flex gap-6 overflow-x-auto pb-4 px-4 scrollbar-hide no-scrollbar snap-x">
          {users.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-3 min-w-[80px] snap-center group/avatar"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-[2rem] overflow-hidden border-2 border-white shadow-md relative z-10 group-hover/avatar:-translate-y-1 transition-transform duration-300">
                  <img 
                    src={profile.avatar_url || `https://picsum.photos/seed/${profile.id}/100/100`} 
                    alt={profile.username}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {profile.role === 'Business' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center z-20 shadow-sm" title="Negocio Verificado">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px] uppercase tracking-tight">
                {profile.username || 'Vecino'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
