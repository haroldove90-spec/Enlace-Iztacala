import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  MapPin, 
  Search, 
  Loader2, 
  ArrowRight,
  User 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useFriendships } from '../lib/supabase-friendships';
import ConnectButton from './ConnectButton';
import type { Profile } from '../types';

interface CommunityViewProps {
  currentUserId: string;
  onViewProfile: (userId: string) => void;
}

export default function CommunityView({ currentUserId, onViewProfile }: CommunityViewProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .neq('id', currentUserId)
      .order('full_name', { ascending: true });

    if (data) setProfiles(data);
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-100">
        <div>
          <h2 className="text-3xl brand-title">Directorio de Vecinos</h2>
          <p className="brand-subtitle mt-2">Encuentra y conecta con otros residentes veríficados de Iztacala.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o @usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-serif italic"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProfiles.map((p) => (
          <div 
            key={p.id} 
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-inner bg-slate-100">
                  <img 
                    src={p.avatar_url || `https://picsum.photos/seed/${p.id}/200/200`} 
                    alt={p.full_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {p.address_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border-4 border-white">
                    <UserCheck size={14} />
                  </div>
                )}
              </div>

              <h3 className="text-xl brand-title leading-tight mb-1 truncate w-full">{p.full_name}</h3>
              <p className="text-xs text-brand-muted font-bold tracking-widest uppercase mb-4">@{p.username}</p>
              
              <p className="text-sm text-slate-500 italic mb-8 line-clamp-2 h-10 w-full px-4">
                {p.bio || "Este vecino aún no ha escrito su biografía en Iztacala."}
              </p>

              <div className="w-full space-y-3">
                <ConnectButton 
                  currentUserId={currentUserId} 
                  targetUserId={p.id} 
                />
                <button 
                  onClick={() => onViewProfile(p.id)}
                  className="w-full py-3 px-6 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Ver Perfil Completo <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProfiles.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <User size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
            <p className="text-slate-400 font-serif italic text-lg">No se encontraron vecinos con ese nombre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
