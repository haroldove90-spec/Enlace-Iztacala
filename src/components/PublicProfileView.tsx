import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Loader2,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserPosts } from '../lib/supabase-hooks';
import { useFriendships } from '../lib/supabase-friendships';
import FriendshipButtons from './FriendshipButtons';
import PostInteractions from './PostInteractions';
import type { Profile, Post } from '../types';

interface PublicProfileViewProps {
  userId: string;
  currentUserId: string;
  onBack: () => void;
}

export default function PublicProfileView({ userId, currentUserId, onBack }: PublicProfileViewProps) {
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { posts, loading: postsLoading } = useUserPosts(userId, currentUserId);
  const { friends, loading: friendshipsLoading } = useFriendships(currentUserId);

  const isFriend = friends.some(f => 
    (f.user_id === userId || f.friend_id === userId) && f.status === 'Accepted'
  );

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setTargetProfile(data);
    setLoading(false);
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;
  if (!targetProfile) return <div>No se encontró el perfil.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Directorio
      </button>

      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="h-64 md:h-80 bg-slate-100 relative">
          {targetProfile.cover_url ? (
            <img 
              src={targetProfile.cover_url} 
              alt="Portada" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-bg to-slate-200" />
          )}
        </div>

        {/* Profile Info */}
        <div className="px-10 pb-12 relative">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16 mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-8 border-white bg-slate-100 shadow-xl overflow-hidden shrink-0">
              <img 
                src={targetProfile.avatar_url || `https://picsum.photos/seed/${targetProfile.id}/200/200`} 
                alt={targetProfile.full_name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl brand-title leading-none">{targetProfile.full_name}</h2>
                {targetProfile.role === 'Admin' && (
                  <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-widest rounded-full">Admin</span>
                )}
              </div>
              <p className="text-sm font-bold tracking-widest uppercase text-brand-muted">@{targetProfile.username}</p>
            </div>
            <div className="w-full md:w-auto pb-2">
                <FriendshipButtons 
                  currentUserId={currentUserId} 
                  targetUserId={targetProfile.id} 
                />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12">
            <div className="space-y-8">
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Biografía</h4>
                <p className="text-xl font-serif italic text-slate-600 leading-relaxed">
                  {targetProfile.bio || "Este vecino prefiere mantener un perfil discreto."}
                </p>
              </div>

              {/* Privacy-Protected Info */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  <Calendar size={14} /> Miembro desde {new Date(targetProfile.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                </div>
                {isFriend ? (
                  <div className="flex items-center gap-2 text-xs text-brand-muted hover:text-emerald-600 transition-colors">
                    <ShieldCheck size={14} className={targetProfile.address_verified ? 'text-emerald-500' : 'text-slate-300'} />
                    {targetProfile.address_verified ? 'Dirección Verificada' : 'Pendiente de Verificación'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-300 italic group relative cursor-help">
                    <Lock size={14} /> Verificación de dirección (Solo Amigos)
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-brand-ink text-white text-[10px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl text-center">
                      Conecta con {targetProfile.full_name} para ver su estado de verificación.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-6">Estadísticas de Vecino</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-serif italic opacity-60">Publicaciones</span>
                  <span className="font-bold">{posts.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-serif italic opacity-60">Conexiones</span>
                  <span className="font-bold">--</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* User Posts */}
      <section className="space-y-10">
        <header className="flex items-end justify-between pb-6 border-b border-slate-100">
          <h3 className="text-2xl brand-title">Actividad Reciente</h3>
        </header>

        <div className="space-y-8">
          {postsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" /></div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <article key={post.id} className="editorial-card flex flex-col group bg-white p-8 rounded-[2.5rem] border border-slate-100">
                <div className="flex-1">
                  <span className={`category-pill mb-4 inline-block ${post.category === 'Comercio' ? 'bg-brand-commerce-bg text-brand-commerce' : 'bg-sky-50 text-sky-700'}`}>
                    {post.category}
                  </span>
                  <p className="text-lg md:text-xl leading-relaxed text-slate-600 mb-8">{post.content}</p>
                </div>
                <PostInteractions post={post} userId={currentUserId} />
              </article>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300">
              Este vecino aún no ha publicado nada en el feed.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
