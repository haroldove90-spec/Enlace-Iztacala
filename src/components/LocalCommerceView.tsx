import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Star, MapPin, ChevronRight, MessageSquare, ExternalLink, Tag, Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Post, Profile, Business } from '../types';
import PostInteractions from './PostInteractions';

interface LocalCommerceViewProps {
  currentUserId: string;
  onViewBusiness: (id: string) => void;
}

export default function LocalCommerceView({ currentUserId, onViewBusiness }: LocalCommerceViewProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [commercePosts, setCommercePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchCommerceData();
  }, [currentUserId]);

  const fetchCommerceData = async () => {
    setLoading(true);
    try {
      // 1. Obtener Negocios Activos (con pago pagado)
      const { data: bizData } = await supabase
        .from('business_directory')
        .select(`
          *,
          owner:profiles(id, username, full_name, avatar_url, cover_url)
        `)
        .eq('payment_status', 'Paid')
        .order('created_at', { ascending: false });

      if (bizData) setBusinesses(bizData);

      // 2. Obtener Posts de Categoría Comercio
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, address_verified, role),
          likes(user_id),
          comments(id)
        `)
        .eq('category', 'Comercio')
        .order('created_at', { ascending: false });

      if (postsData) {
        const formatted = postsData.map((p: any) => ({
          ...p,
          likes_count: p.likes?.length || 0,
          comments_count: p.comments?.length || 0,
          has_liked: p.likes?.some((l: any) => l.user_id === currentUserId)
        }));
        setCommercePosts(formatted);
      }
    } catch (error) {
      console.error('Error fetching commerce data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.business_name.toLowerCase().includes(filter.toLowerCase()) ||
    b.description?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-20">
      {/* Hero Section / Banners Carousel (Simulated) */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-4xl brand-title leading-tight">Comercio Local</h2>
            <p className="brand-subtitle mt-2">Apoya a tus vecinos y descubre tesoros en Iztacala.</p>
          </div>
          <div className="hidden md:flex gap-2">
             <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
               <Star size={12} className="fill-emerald-600" /> Destacados de la semana
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.slice(0, 3).map((biz) => (
            <motion.div
              key={biz.id}
              whileHover={{ y: -5 }}
              className="group relative h-64 rounded-[2.5rem] overflow-hidden shadow-lg cursor-pointer"
              onClick={() => onViewBusiness(biz.user_id)}
            >
              <img 
                src={biz.banner_url || "https://picsum.photos/seed/shop/800/600"} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20">
                    <img src={biz.owner?.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-white font-serif text-xl">{biz.business_name}</h3>
                </div>
                <p className="text-white/70 text-xs line-clamp-2 italic font-serif leading-relaxed">{biz.description}</p>
              </div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-[9px] font-bold text-white uppercase tracking-widest">
                Abierto
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Search & Directory */}
      <section className="grid lg:grid-cols-[1fr_350px] gap-12">
        <div className="space-y-12">
          {/* Commerce Feed */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-serif text-2xl">Ofertas y Novedades</h3>
            <div className="flex items-center gap-4">
               <Tag size={16} className="text-brand-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Posts de Negocios</span>
            </div>
          </div>

          <div className="space-y-10">
            {commercePosts.length > 0 ? (
              commercePosts.map((post) => (
                <article key={post.id} className="editorial-card group">
                  <div className="flex items-center justify-between mb-6">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group/author"
                      onClick={() => onViewBusiness(post.user_id)}
                    >
                      <img 
                        src={post.author?.avatar_url || `https://picsum.photos/seed/${post.user_id}/50/50`} 
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-md transition-transform group-hover/author:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold leading-none group-hover/author:text-brand-primary transition-colors">{post.author?.full_name}</h4>
                          <div className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[8px] font-black uppercase tracking-widest">Negocio</div>
                        </div>
                        <p className="text-[10px] text-brand-muted font-medium mt-1">Socio Comunitario</p>
                      </div>
                    </div>
                  </div>

                  {post.image_url && (
                    <div className="mb-6 rounded-[2rem] overflow-hidden bg-slate-100 aspect-video shadow-sm">
                      <img src={post.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <p className="text-lg md:text-xl leading-relaxed text-slate-700 mb-8 font-serif italic">{post.content}</p>
                  
                  <PostInteractions post={post} userId={currentUserId} />
                </article>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                 <p className="text-brand-muted font-serif italic">No hay promociones activas en este momento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Directory Sidebar */}
        <aside className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-10">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-ink mb-6">Directorio Iztacala</h4>
            
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar comercio..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-brand-primary transition-all border border-transparent focus:border-brand-primary/20"
              />
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredBusinesses.map((biz) => (
                <button 
                  key={biz.id}
                  onClick={() => onViewBusiness(biz.user_id)}
                  className="w-full p-4 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-4 group text-left border border-transparent hover:border-slate-100"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                    <img src={biz.owner?.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-sm truncate group-hover:text-brand-primary transition-colors">{biz.business_name}</h5>
                    <p className="text-[10px] text-brand-muted truncate font-serif italic">{biz.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
              {filteredBusinesses.length === 0 && (
                <p className="text-center text-[11px] text-slate-400 italic py-10">No se encontraron negocios.</p>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50">
               <button className="w-full py-4 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                 Inscribir mi Negocio
               </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
