import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Send, Loader2, Circle, ArrowLeft, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useChat } from '../lib/supabase-chat';
import { useFriendships } from '../lib/supabase-friendships';
import { toast } from 'react-hot-toast';
import type { Profile, Message } from '../types';

interface FloatingChatProps {
  currentUserId: string;
}

export default function FloatingChat({ currentUserId }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastPopup, setLastPopup] = useState<{ actor: Profile; content: string } | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { friends, removeFriendship } = useFriendships(currentUserId);
  const { messages, isTyping, sendMessage, sendTypingNotification } = useChat(currentUserId, selectedFriend?.id || null);

  // Cargar lista de conversaciones (basada en mensajes recientes)
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return;
      
      // Obtenemos IDs únicos de personas con las que hayamos intercambiado mensajes
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, recipient_id')
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const partnerIds = Array.from(new Set(data.flatMap(m => 
          m.sender_id === currentUserId ? [m.recipient_id] : [m.sender_id]
        )));

        if (partnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', partnerIds);
          
          if (profiles) setConversations(profiles);
        }
      }
    };

    fetchConversations();
    
    // Suscribirse a mensajes nuevos para actualizar la lista de conversaciones
    const channel = supabase
      .channel(`convos:${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchConversations)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  // Solicitar permiso para notificaciones nativas
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Escuchar mensajes globales para Popups y Notificaciones Nativas
  useEffect(() => {
    const channel = supabase
      .channel(`global_messages:${currentUserId}:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `recipient_id=eq.${currentUserId}`
      }, async (payload) => {
        const msg = payload.new as Message;
        
        // No mostrar popup si ya estamos hablando con esa persona y el chat está abierto
        if (selectedFriend?.id === msg.sender_id && isOpen && !isMinimized) return;

        // Obtener perfil del actor para el popup
        const { data: actor } = await supabase.from('profiles').select('*').eq('id', msg.sender_id).single();
        
        if (actor) {
          // 1. Mostrar Popup Visual en la app
          setLastPopup({ actor, content: msg.content });
          setUnreadCount(prev => prev + 1);
          
          // Auto-ocultar popup después de 5 seg
          setTimeout(() => setLastPopup(null), 5000);

          // 2. Notificación Nativa si la app está en segundo plano o el chat cerrado
          if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
            new Notification(`Mensaje de ${actor.full_name}`, {
              body: msg.content,
              icon: actor.avatar_url || '/favicon.ico',
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedFriend, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    sendMessage(newMessage);
    setNewMessage('');
    sendTypingNotification(false);
  };

  const openConversation = (friend: Profile) => {
    setSelectedFriend(friend);
    setIsOpen(true);
    setIsMinimized(false);
    setLastPopup(null);
    setUnreadCount(0);
  };

  return (
    <div className="fixed bottom-24 right-6 md:bottom-28 md:right-10 z-[100] flex flex-col items-end gap-3 pointer-events-none transition-all">
      {/* 1. Popup de Mensaje Entrante */}
      <AnimatePresence>
        {lastPopup && !isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            onClick={() => openConversation(lastPopup.actor)}
            className="pointer-events-auto bg-white p-4 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 flex items-center gap-4 cursor-pointer hover:scale-105 transition-all max-w-[260px] md:max-w-xs group"
          >
            <div className="relative shrink-0">
              <img src={lastPopup.actor.avatar_url || `https://picsum.photos/seed/${lastPopup.actor.id}/100/100`} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-brand-primary rounded-full border-2 border-white animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mb-1">Mensaje Nuevo</p>
              <p className="text-xs font-bold text-brand-ink truncate">{lastPopup.actor.full_name}</p>
              <p className="text-[10px] text-brand-muted truncate italic">"{lastPopup.content}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Ventana de Chat Flotante */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="pointer-events-auto fixed md:absolute inset-x-4 bottom-28 md:inset-auto md:right-0 md:bottom-20 w-auto md:w-80 h-[500px] mb-2 bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col overflow-hidden max-h-[70vh] z-[110]"
          >
            {/* Header */}
            <header className="p-4 bg-brand-ink text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {selectedFriend ? (
                  <>
                    <img src={selectedFriend.avatar_url || `https://picsum.photos/seed/${selectedFriend.id}/100/100`} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="text-[11px] font-bold tracking-tight">{selectedFriend.full_name}</h4>
                      {isTyping ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Escribiendo</span>
                          <div className="flex gap-0.5">
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1] }} className="w-0.5 h-0.5 bg-emerald-400 rounded-full" />
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1], delay: 0.2 }} className="w-0.5 h-0.5 bg-emerald-400 rounded-full" />
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1], delay: 0.4 }} className="w-0.5 h-0.5 bg-emerald-400 rounded-full" />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                          En línea
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <h4 className="text-[11px] font-bold tracking-widest uppercase">Mensajes Privados</h4>
                )}
              </div>
                <div className="flex items-center gap-1">
                  {selectedFriend && (
                    <div className="relative">
                      <button 
                        onClick={() => setShowOptions(!showOptions)} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>
                      
                      <AnimatePresence>
                        {showOptions && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 py-1"
                          >
                            <button 
                              onClick={async () => {
                                if (!confirm(`¿Eliminar a ${selectedFriend.full_name} de tus conexiones?`)) return;
                                
                                const friendship = friends.find(f => 
                                  (f.user_id === currentUserId && f.friend_id === selectedFriend.id) || 
                                  (f.user_id === selectedFriend.id && f.friend_id === currentUserId)
                                );
                                
                                if (friendship) {
                                  try {
                                    await removeFriendship(friendship.id);
                                    toast.success('Conexión eliminada');
                                    setSelectedFriend(null);
                                    setShowOptions(false);
                                  } catch (e) {
                                    toast.error('Error al eliminar');
                                  }
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 size={12} /> Eliminar Vecino
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {selectedFriend && (
                    <button onClick={() => setSelectedFriend(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors mr-1">
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <Minimize2 size={14} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </div>
            </header>

            {selectedFriend ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.sender_id === currentUserId 
                        ? 'bg-brand-primary text-white rounded-tr-none' 
                        : 'bg-white text-brand-ink border border-slate-100 rounded-tl-none font-serif italic'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-50 flex items-center gap-2 mt-auto">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      sendTypingNotification(e.target.value.length > 0);
                    }}
                    placeholder="Escribe..."
                    className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-primary font-serif italic"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 bg-brand-ink text-white rounded-xl flex items-center justify-center hover:bg-brand-primary transition-all active:scale-95 disabled:opacity-30 shadow-md group"
                  >
                    <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </form>
              </>
            ) : (
              /* Conversation List */
              <div className="flex-1 overflow-y-auto bg-slate-50/30 scrollbar-hide">
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
                  <h5 className="text-[9px] font-bold uppercase tracking-widest text-brand-muted">Mensajes Recientes</h5>
                </div>
                <div className="p-2 space-y-1">
                  {conversations.length > 0 ? (
                    conversations.map((c) => (
                      <button 
                        key={c.id}
                        onClick={() => openConversation(c)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-white rounded-2xl transition-all group"
                      >
                        <div className="relative">
                          <img 
                            src={c.avatar_url || `https://picsum.photos/seed/${c.id}/100/100`} 
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-primary/20" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold text-brand-ink truncate">{c.full_name}</p>
                          <p className="text-[10px] text-brand-muted truncate">@{c.username}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-300">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-serif italic">No tienes conversaciones activas aún.</p>
                      <p className="text-[10px] mt-2 text-brand-muted font-sans uppercase tracking-tighter">Busca vecinos en el mapa para conectar</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Botón / Burbuja Principal */}
      <button 
        onClick={() => {
          if (isOpen) setIsMinimized(!isMinimized);
          else setIsOpen(true);
        }}
        className={`pointer-events-auto w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 z-50 group relative ${
          isOpen && !isMinimized ? 'bg-brand-ink text-white rotate-180' : 'bg-white text-brand-ink'
        }`}
      >
        {isOpen && !isMinimized ? (
          <Minimize2 size={24} />
        ) : (
          <>
            <MessageSquare size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-brand-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </>
        )}
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-4 px-4 py-2 bg-brand-ink text-white text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all shadow-xl">
            Chat proactivo
          </div>
        )}
      </button>
    </div>
  );
}
