import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import type { Message } from '../types';

/**
 * Hook para chat privado en tiempo real entre amigos.
 */
export function useChat(currentUserId: string, friendId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentUserId || !friendId) return;

    // 1. Cargar historial
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data);
    };

    fetchMessages();

    // 2. Escuchar mensajes nuevos (Tiempo real)
    const messageChannel = supabase
      .channel(`chat:${[currentUserId, friendId].sort().join('-')}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        // Solo añadir si el mensaje pertenece a esta conversación y no ha sido ya añadido localmente
        const isFromMe = newMessage.sender_id === currentUserId && newMessage.recipient_id === friendId;
        const isFromThem = newMessage.sender_id === friendId && newMessage.recipient_id === currentUserId;
        
        if (isFromThem) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      })
      // 3. Sistema de Presencia / Escribiendo...
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === friendId) {
          setIsTyping(payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [currentUserId, friendId]);

  const sendMessage = async (content: string) => {
    if (!currentUserId || !friendId || !content.trim()) return;

    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        sender_id: currentUserId, 
        recipient_id: friendId, 
        content 
      }])
      .select()
      .single();

    if (error) throw error;
    setMessages(prev => [...prev, data]);
  };

  const sendTypingNotification = (isTyping: boolean) => {
    if (!currentUserId || !friendId) return;

    supabase.channel(`chat:${[currentUserId, friendId].sort().join('-')}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping }
    });
  };

  return { messages, isTyping, sendMessage, sendTypingNotification };
}
