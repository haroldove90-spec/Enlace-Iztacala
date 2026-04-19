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
  const messageChannelRef = useRef<any>(null);

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
      .channel(`chat:${[currentUserId, friendId].sort().join('-')}:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `or(sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId})`
      }, (payload) => {
        const newMessage = payload.new as Message;
        
        // Verificar si el mensaje pertenece a ESTA conversación específica
        const isFromMe = newMessage.sender_id === currentUserId && newMessage.recipient_id === friendId;
        const isFromThem = newMessage.sender_id === friendId && newMessage.recipient_id === currentUserId;
        
        if (isFromMe || isFromThem) {
          setMessages(prev => {
            // Evitar duplicados (especialmente los insertados localmente por sendMessage)
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

    messageChannelRef.current = messageChannel;

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
    if (!currentUserId || !friendId || !messageChannelRef.current) return;

    messageChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping }
    });
  };

  return { messages, isTyping, sendMessage, sendTypingNotification };
}
