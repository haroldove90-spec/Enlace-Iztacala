import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, Search, MoreVertical, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFriendships } from '../lib/supabase-friendships';
import { useChat } from '../lib/supabase-chat';
import type { Profile } from '../types';

interface ChatViewProps {
  userId: string;
}

export default function ChatView({ userId }: ChatViewProps) {
  const { friends, requests, updateRequestStatus, loading: friendsLoading } = useFriendships(userId);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isTyping, sendMessage, sendTypingNotification } = useChat(userId, selectedFriend?.id || null);

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
      {/* Sidebar: Friends List */}
      <div className="w-80 border-r border-slate-50 overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <h3 className="text-xl font-serif font-medium text-brand-ink">Mensajes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar amigos..." 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>
        </div>

        <div className="flex-1">
          {requests.length > 0 && (
            <div className="p-4 space-y-3 bg-brand-primary/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary px-2">Solicitudes Pendientes</p>
              {requests.map(req => (
                <div key={req.id} className="p-3 bg-white rounded-2xl shadow-sm border border-brand-primary/10 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <img src={req.friend?.avatar_url || `https://picsum.photos/seed/${req.id}/100/100`} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-medium">{req.friend?.full_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateRequestStatus(req.id, 'Accepted')}
                      className="flex-1 py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-lg"
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 p-4">Amigos Conectados</p>
            {friends.map(f => (
              <button 
                key={f.id}
                onClick={() => setSelectedFriend(f.friend!)}
                className={`w-full p-4 flex items-center gap-4 rounded-3xl transition-all ${
                  selectedFriend?.id === f.friend?.id ? 'bg-slate-50 shadow-inner' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative">
                  <img src={f.friend?.avatar_url || `https://picsum.photos/seed/${f.id}/100/100`} className="w-12 h-12 rounded-full object-cover" />
                  <Circle className="absolute bottom-0 right-0 text-emerald-500 fill-emerald-500" size={10} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-brand-ink">{f.friend?.full_name}</p>
                  <p className="text-[10px] text-brand-muted truncate font-serif italic">Haz clic para chatear</p>
                </div>
              </button>
            ))}
            {friends.length === 0 && !friendsLoading && (
              <div className="p-8 text-center space-y-2">
                <Users className="mx-auto text-slate-200" size={32} />
                <p className="text-xs text-slate-400 font-serif italic">Aún no tienes amigos en Iztacala.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {selectedFriend ? (
          <>
            {/* Header */}
            <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={selectedFriend.avatar_url || `https://picsum.photos/seed/${selectedFriend.id}/100/100`} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-bold text-brand-ink">{selectedFriend.full_name}</h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    {isTyping ? 'Escribiendo...' : <><Circle size={6} fill="currentColor" /> En línea</>}
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-brand-ink transition-colors">
                <MoreVertical size={20} />
              </button>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-[1.5rem] text-sm shadow-sm ${
                    msg.sender_id === userId 
                    ? 'bg-brand-ink text-white rounded-tr-none' 
                    : 'bg-white text-brand-ink border border-slate-100 rounded-tl-none font-serif'
                  }`}>
                    {msg.content}
                    <div className={`text-[9px] mt-1 opacity-50 ${msg.sender_id === userId ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <footer className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Escribe un mensaje boutique..."
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none font-serif italic"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-brand-ink text-white rounded-xl hover:bg-brand-primary transition-all disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-12">
            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare className="text-brand-primary" size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-serif text-brand-ink mb-2">Selecciona un Vecino</h3>
              <p className="text-brand-muted max-w-xs font-serif italic text-base">Inicia una conversación privada con tus amigos de la colonia Los Reyes Iztacala.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
