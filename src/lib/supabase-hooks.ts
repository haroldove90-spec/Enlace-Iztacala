import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Post, Incident } from '../types';

/**
 * Hook centralizado para manejar los datos de la comunidad en tiempo real.
 */
export function useCommunityData() {
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
          author:profiles(id, username, full_name, avatar_url, address_verified)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) setPosts(data);
    };

    fetchPosts();

    // Suscripción en tiempo real
    const postSubscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
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
      .channel('public:incidents')
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
 * Funciones de inserción
 */
export async function createPost(content: string, category: string, userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ user_id: userId, content, category }])
    .select();
  
  if (error) throw error;
  return data;
}

export async function createIncident(title: string, description: string, location: string, userId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .insert([{ user_id: userId, title, description, location }])
    .select();

  if (error) throw error;
  return data;
}
