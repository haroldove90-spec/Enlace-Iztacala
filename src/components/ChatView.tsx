import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, Search, MoreVertical, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useFriendships } from '../lib/supabase-friendships';
import { useChat } from '../lib/supabase-chat';
import type { Profile } from '../types';

interface ChatViewProps {
  userId: string;
  preSelectedUserId?: string | null;
}

export default function ChatView({ userId, preSelectedUserId }: ChatViewProps) {
  const { friends, receivedRequests, updateRequestStatus, loading: friendsLoading } = useFriendships(userId);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isTyping, sendMessage, sendTypingNotification } = useChat(userId, selectedFriend?.id || null);

  // Cargar conversaciones recientes (mensajes con cualquier usuario)
  useEffect(() => {
    fetchRecentConversations();
  }, [userId, friends]);

  const fetchRecentConversations = async () => {
    setLoadingConv(true);
    // 1. Obtener IDs únicos de destinatarios y remitentes en mensajes
    const { data: sentMessages } = await supabase.from('messages').select('recipient_id').eq('sender_id', userId);
    const { data: receivedMessages } = await supabase.from('messages').select('sender_id').eq('recipient_id', userId);

    const uniqueUserIds = Array.from(new Set([
      ...(sentMessages?.map(m => m.recipient_id) || []),
      ...(receivedMessages?.map(m => m.sender_id) || [])
    ]));

    // 2. Obtener los perfiles de esos IDs
    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', uniqueUserIds);
      if (profiles) {
        // Combinar con amigos (asegurar que amigos sin mensajes también aparezcan si queremos, 
        // o solo gente con la que hayamos hablado)
        const allProfiles = [...profiles];
        friends.forEach(f => {
          if (f.friend && !allProfiles.some(p => p.id === f.friend?.id)) {
            allProfiles.push(f.friend);
          }
        });
        setConversations(allProfiles);
      }
    } else if (friends.length > 0) {
      setConversations(friends.map(f => f.friend).filter(Boolean) as Profile[]);
    }
    setLoadingConv(false);
  };

  // Manejar el pre-seleccionado desde el perfil
  useEffect(() => {
    if (preSelectedUserId) {
      const fetchPreSelected = async () => {
        // Buscar en locales
        const existing = conversations.find(p => p.id === preSelectedUserId);
        if (existing) {
          setSelectedFriend(existing);
        } else {
          // Fetch remoto si no está en la lista actual
          const { data } = await supabase.from('profiles').select('*').eq('id', preSelectedUserId).single();
          if (data) {
            setSelectedFriend(data);
            setConversations(prev => [data, ...prev]);
          }
        }
      };
      fetchPreSelected();
    }
  }, [preSelectedUserId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage('');
    sendTypingNotification(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTypingNotification(e.target.value.length > 0);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className="w-80 border-r border-slate-50 overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <h3 className="text-xl font-serif font-medium text-brand-ink">Mensajes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar vecinos..." 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-1 focus:ring-brand-primary outline-none font-serif italic"
            />
          </div>
        </div>

        <div className="flex-1">
          {receivedRequests.length > 0 && (
            <div className="p-4 space-y-3 bg-brand-primary/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary px-2">Solicitudes Pendientes</p>
              {receivedRequests.map(req => (
                <div key={req.id} className="p-3 bg-white rounded-2xl shadow-sm border border-brand-primary/10 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <img src={req.friend?.avatar_url || `https://picsum.photos/seed/${req.id}/100/100`} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <span className="text-xs font-medium">{req.friend?.full_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateRequestStatus(req.id, 'Accepted')}
                      className="flex-1 py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-lg hover:bg-brand-ink transition-colors"
                    >
                      Aceptar
                    </button>
                    <button 
                      onClick={() => updateRequestStatus(req.id, 'Blocked')}
                      className="flex-1 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 p-4">Conversaciones</p>
            {conversations.map(conv => (
              <button 
                key={conv.id}
                onClick={() => setSelectedFriend(conv)}
                className={`w-full p-4 flex items-center gap-4 rounded-3xl transition-all ${
                  selectedFriend?.id === conv.id ? 'bg-slate-50 shadow-inner' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative">
                  <img src={conv.avatar_url || `https://picsum.photos/seed/${conv.id}/100/100`} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
                  <Circle className="absolute bottom-0 right-0 text-emerald-500 fill-emerald-500" size={10} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-brand-ink">{conv.full_name}</p>
                  <p className="text-[10px] text-brand-muted truncate font-serif italic opacity-60">@{conv.username}</p>
                </div>
              </button>
            ))}
            {conversations.length === 0 && !loadingConv && (
              <div className="p-8 text-center space-y-2">
                <Users className="mx-auto text-slate-200" size={32} />
                <p className="text-xs text-slate-400 font-serif italic text-balance px-4 leading-relaxed">Inicia una conversación buscando a un vecino en el directorio.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#FDFDFD]">
        {selectedFriend ? (
          <>
            {/* Header */}
            <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={selectedFriend.avatar_url || `https://picsum.photos/seed/${selectedFriend.id}/100/100`} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50 shadow-sm" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-sm font-bold text-brand-ink">{selectedFriend.full_name}</h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    {isTyping ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>Escribiendo...</motion.span> : <><Circle size={6} fill="currentColor" /> En línea</>}
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-brand-ink transition-colors p-2 rounded-full hover:bg-slate-50">
                <MoreVertical size={20} />
              </button>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-5 rounded-[1.8rem] text-[13px] leading-relaxed shadow-sm transition-all hover:shadow-md ${
                    msg.sender_id === userId 
                    ? 'bg-brand-primary text-white rounded-tr-none' 
                    : 'bg-white text-brand-ink border border-slate-100 rounded-tl-none font-serif italic'
                  }`}>
                    {msg.content}
                    <div className={`text-[8px] mt-2 opacity-50 uppercase tracking-widest font-bold ${msg.sender_id === userId ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <footer className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Escribe un mensaje boutique..."
                  className="flex-1 bg-transparent border-none px-6 py-3 text-[13px] outline-none font-serif italic text-brand-ink placeholder:text-slate-300"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 flex items-center justify-center bg-brand-ink text-white rounded-[1.2rem] hover:bg-brand-primary transition-all disabled:opacity-30 disabled:grayscale transform hover:scale-105 active:scale-95 shadow-lg shadow-slate-100"
                >
                  <Send size={18} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center"
            >
              <MessageSquare className="text-brand-primary" size={40} />
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-brand-ink">Bandeja de Entrada</h3>
              <p className="text-brand-muted max-w-xs font-serif italic text-base leading-relaxed">Conecta de forma privada con los vecinos de Iztacala. Tu comunicación es segura y exclusiva.</p>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-300">Nexo Reyes • 2026</p>
          </div>
        )}
      </div>
    </div>
  );
}
