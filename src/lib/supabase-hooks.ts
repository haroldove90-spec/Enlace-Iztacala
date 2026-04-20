import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Post, Incident, Comment, Like } from '../types';

/**
 * Hook centralizado para manejar los datos de la comunidad en tiempo real.
 */
export function useCommunityData(currentUserId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Obtener Posts Iniciales y Escuchar Cambios
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, address_verified),
          likes(user_id),
          comments(id),
          is_favorite:favorites(user_id)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedPosts = data.map((post: any) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          has_liked: post.likes?.some((l: any) => l.user_id === currentUserId),
          is_favorite: post.is_favorite?.some((f: any) => f.user_id === currentUserId)
        }));
        setPosts(formattedPosts);
      }
    };

    fetchPosts();

    // Suscripción en tiempo real
    const postSubscription = supabase
      .channel(`public:posts:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, []);

  // 2. Obtener Incidentes Iniciales y Escuchar Cambios
  useEffect(() => {
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setIncidents(data);
    };

    fetchIncidents();

    const incidentSubscription = supabase
      .channel(`public:incidents:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchIncidents)
      .subscribe();

    return () => {
      supabase.removeChannel(incidentSubscription);
    };
  }, []);

  useEffect(() => {
    if (posts.length > 0 || incidents.length > 0) {
      setLoading(false);
    }
  }, [posts, incidents]);

  return { posts, incidents, loading };
}

/**
 * Hook para obtener posts de un usuario específico.
 */
export function useUserPosts(userId: string, currentUserId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUserPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, address_verified),
          likes(user_id),
          comments(id),
          is_favorite:favorites(user_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedPosts = data.map((post: any) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          has_liked: post.likes?.some((l: any) => l.user_id === currentUserId),
          is_favorite: post.is_favorite?.some((f: any) => f.user_id === currentUserId)
        }));
        setPosts(formattedPosts);
      }
      setLoading(false);
    };

    fetchUserPosts();

    const postSubscription = supabase
      .channel(`public:posts:${userId}:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${userId}` }, fetchUserPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, [userId, currentUserId]);

  return { posts, loading };
}

/**
 * Funciones de inserción
 */
export async function createPost(content: string, category: string, userId: string, imageUrl?: string) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ user_id: userId, content, category, image_url: imageUrl }])
    .select();
  
  if (error) throw error;
  return data;
}

export async function createIncident(title: string, description: string, location: string, userId: string, photoUrl?: string) {
  const { data, error } = await supabase
    .from('incidents')
    .insert([{ user_id: userId, title, description, location, photo_url: photoUrl }])
    .select();

  if (error) throw error;
  return data;
}

/**
 * Interacciones: Likes y Comentarios
 */
export async function toggleLike(postId: string, userId: string, hasLiked: boolean) {
  if (hasLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ post_id: postId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('likes')
      .insert([{ post_id: postId, user_id: userId }]);
    if (error) throw error;
  }
}

export async function toggleFavorite(postId: string, userId: string, isFavorite: boolean) {
  if (isFavorite) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({ post_id: postId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert([{ post_id: postId, user_id: userId }]);
    if (error) throw error;
  }
}

export async function addComment(postId: string, userId: string, content: string) {
  const { error } = await supabase
    .from('comments')
    .insert([{ post_id: postId, user_id: userId, content }]);
  if (error) throw error;
}

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(id, username, full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Almacenamiento (Storage)
 */
export async function uploadFile(bucket: string, file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}
