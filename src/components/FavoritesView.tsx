import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Bookmark, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import PostInteractions from './PostInteractions';
import type { Post } from '../types';
import { toast } from 'react-hot-toast';

interface FavoritesViewProps {
  userId: string;
  onBack: () => void;
}

export default function FavoritesView({ userId, onBack }: FavoritesViewProps) {
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
    
    // Suscripción para cambios en favoritos
    const channel = supabase
      .channel('favorites-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${userId}` }, () => {
        fetchFavorites();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          post_id,
          posts (
            *,
            author:profiles(id, username, full_name, avatar_url, address_verified),
            likes(user_id),
            comments(id),
            favorites(user_id)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedPosts = data
          .map((f: any) => f.posts)
          .filter(Boolean)
          .map((post: any) => ({
            ...post,
            likes_count: post.likes?.length || 0,
            comments_count: post.comments?.length || 0,
            has_liked: post.likes?.some((l: any) => l.user_id === userId),
            is_favorite: true // Si está en esta lista, es favorito
          }));
        setFavorites(formattedPosts);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      toast.error('No se pudieron cargar tus guardados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 md:py-10">
      <header className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white rounded-2xl transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="brand-title !text-2xl md:!text-3xl">Mis Guardados</h2>
          <p className="brand-subtitle">Publicaciones que quieres tener a la mano</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="space-y-8">
          {favorites.map((post) => (
            <article key={post.id} className="editorial-card flex flex-col group">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.author?.avatar_url || `https://picsum.photos/seed/${post.user_id}/50/50`} 
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold leading-none mb-0.5">{post.author?.full_name}</h4>
                      <p className="text-[10px] text-brand-muted tracking-tight font-medium uppercase font-sans">@{post.author?.username}</p>
                    </div>
                  </div>
                  <span className={`category-pill ${post.category === 'Comercio' ? 'bg-brand-commerce-bg text-brand-commerce' : 'bg-sky-100 text-sky-700'}`}>
                    {post.category}
                  </span>
                </div>
                
                {post.image_url && (
                  <div className="mb-6 rounded-[2rem] overflow-hidden bg-slate-100 aspect-video">
                    <img src={post.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}

                <p className="text-sm md:text-lg leading-relaxed text-slate-600 mb-8 font-serif italic">{post.content}</p>
              </div>
              <PostInteractions post={post} userId={userId} />
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
          <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-8">
            <Bookmark size={40} className="text-brand-muted opacity-20" />
          </div>
          <h3 className="text-xl font-serif italic text-brand-ink mb-3 uppercase tracking-tight">Archivo vacío</h3>
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-[0.2em] max-w-[250px] mx-auto leading-relaxed">
            Aún no has guardado ninguna publicación. Dale click al icono de marcador en cualquier post para verlo aquí.
          </p>
        </div>
      )}
    </div>
  );
}
