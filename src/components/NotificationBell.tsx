import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, UserPlus, Heart, MessageCircle, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications, Notification } from '../lib/supabase-notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationBellProps {
  userId: string;
  onViewAll?: () => void;
}

export default function NotificationBell({ userId, onViewAll }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus size={16} className="text-blue-500" />;
      case 'message': return <MessageSquare size={16} className="text-emerald-500" />;
      case 'like': return <Heart size={16} className="text-rose-500" />;
      case 'comment': return <MessageCircle size={16} className="text-amber-500" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  const getMessage = (notification: Notification) => {
    const actorName = notification.actor?.full_name || 'Alguien';
    switch (notification.type) {
      case 'friend_request': return `te envió una solicitud de conexión.`;
      case 'message': return `te envió un mensaje privado.`;
      case 'like': return `le dio like a tu publicación.`;
      case 'comment': return `comentó tu publicación.`;
      default: return `tiene una actualización para ti.`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-slate-50 text-slate-400 hover:text-brand-primary hover:bg-white hover:shadow-sm rounded-2xl transition-all relative group"
      >
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed md:absolute right-4 left-4 md:left-auto md:right-0 top-20 md:top-auto md:mt-4 md:w-96 bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100 z-[100] overflow-hidden"
          >
            <header className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-ink uppercase tracking-wider">Avisos del Vecindario</h3>
                <p className="text-[10px] text-brand-muted font-serif italic">Tienes {unreadCount} notificaciones nuevas</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-brand-primary"
                    title="Marcar todo como leído"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 md:hidden"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto overflow-x-hidden">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`p-5 flex gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer group relative ${!n.is_read ? 'bg-brand-primary/[0.02]' : ''}`}
                    >
                      {!n.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                      )}
                      <div className="relative shrink-0">
                        <img 
                          src={n.actor?.avatar_url || `https://picsum.photos/seed/${n.actor_id}/100/100`} 
                          alt="Actor"
                          className="w-10 h-10 rounded-full object-cover border border-slate-100"
                        />
                        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
                          {getIcon(n.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-brand-ink leading-tight">
                          <span className="font-bold">{n.actor?.full_name || 'Vecino'}</span> {getMessage(n)}
                        </p>
                        {n.type === 'message' && n.content && (
                          <p className="text-[11px] text-brand-muted mt-1 italic line-clamp-1">
                            "{n.content}"
                          </p>
                        )}
                        <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-widest font-bold">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-300">
                  <Bell size={32} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-serif italic">No hay avisos recientes en tu zona.</p>
                </div>
              )}
            </div>

            <footer className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  onViewAll?.();
                }}
                className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-primary transition-colors"
              >
                Ver historial completo
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
