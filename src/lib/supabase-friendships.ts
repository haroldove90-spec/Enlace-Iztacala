import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Friendship, FriendshipStatus } from '../types';

/**
 * Hook para gestionar amistades en tiempo real.
 */
export function useFriendships(currentUserId: string) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = async () => {
    if (!currentUserId) return;

    try {
      // Obtener amistades aceptadas y pendientes
      // Simplificamos la consulta para evitar problemas con nombres de llaves foráneas específicos
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          user_profile:profiles!user_id(id, username, full_name, avatar_url),
          friend_profile:profiles!friend_id(id, username, full_name, avatar_url)
        `)
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (error) {
        console.error('Error fetching friendships:', error);
      } else if (data) {
        const formatted = data.map((f: any) => {
          const isRequester = f.user_id === currentUserId;
          return {
            ...f,
            friend: isRequester ? f.friend_profile : f.user_profile
          };
        });

        setFriends(formatted.filter(f => f.status === 'Accepted'));
        setReceivedRequests(formatted.filter(f => f.status === 'Pending' && f.friend_id === currentUserId));
        setSentRequests(formatted.filter(f => f.status === 'Pending' && f.user_id === currentUserId));
      }
    } catch (e) {
      console.error('Unexpected error in useFriendships:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendships();

    const channel = supabase
      .channel(`friendships:${currentUserId}:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friendships' 
      }, fetchFriendships)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const sendRequest = async (friendId: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert([{ user_id: currentUserId, friend_id: friendId, status: 'Pending' }]);
    if (error) throw error;
  };

  const updateRequestStatus = async (requestId: string, status: FriendshipStatus) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('id', requestId);
    if (error) throw error;
  };

  const removeFriendship = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) throw error;
  };

  return { 
    friends, 
    receivedRequests, 
    sentRequests, 
    loading, 
    sendRequest, 
    updateRequestStatus, 
    removeFriendship 
  };
}
