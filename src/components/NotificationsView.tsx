import React from 'react';
import { useNotifications, Notification } from '../lib/supabase-notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, MessageSquare, UserPlus, Heart, MessageCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationsViewProps {
  userId: string;
  onBack: () => void;
}

export default function NotificationsView({ userId, onBack }: NotificationsViewProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(userId);

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus size={18} className="text-brand-primary" />;
      case 'message': return <MessageSquare size={18} className="text-emerald-500" />;
      case 'like': return <Heart size={18} className="text-rose-500" />;
      case 'comment': return <MessageCircle size={18} className="text-amber-500" />;
      case 'system': return <Bell size={18} className="text-indigo-500" />;
      default: return <Bell size={18} className="text-slate-400" />;
    }
  };

  const getMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'friend_request': return `te envió una solicitud de conexión.`;
      case 'message': return `te envió un mensaje privado.`;
      case 'like': return `le dio like a tu publicación.`;
      case 'comment': return `comentó tu publicación.`;
      case 'system': return `Aviso de Enlace Iztacala`;
      default: return `tiene una actualización para ti.`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 md:py-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-2xl transition-colors shadow-sm md:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="brand-title !text-2xl md:!text-3xl">Avisos del Vecindario</h2>
            <p className="brand-subtitle">Mantente al tanto de la actividad en Iztacala</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:shadow-lg hover:bg-slate-50 transition-all active:scale-95"
          >
            <CheckCircle2 size={14} /> Marcar todo como leído
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((n, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`editorial-card !p-6 flex flex-col sm:flex-row gap-5 cursor-pointer group hover:bg-white transition-all ring-offset-4 ring-offset-slate-50 ${!n.is_read ? 'border-rose-500/30 bg-rose-50/10 ring-1 ring-rose-500/10' : 'border-slate-50 bg-white'}`}
            >
              <div className="flex items-center gap-4 sm:shrink-0">
                <div className="relative">
                  <img 
                    src={n.type === 'system' ? '/logo.png' : (n.actor?.avatar_url || `https://picsum.photos/seed/${n.actor_id}/100/100`)} 
                    alt="Actor"
                    className="w-14 h-14 rounded-[1.5rem] object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg border border-slate-50">
                    {getIcon(n.type)}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                  <h4 className="text-sm font-bold text-brand-ink">
                    {n.type === 'system' ? 'Enlace Iztacala' : (n.actor?.full_name || 'Un vecino')} <span className="font-normal text-slate-500">{getMessage(n)}</span>
                  </h4>
                  <span className="text-[10px] text-brand-muted uppercase tracking-widest font-bold shrink-0">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                
                {n.content && (
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <p className="text-xs text-brand-muted italic leading-relaxed">
                      "{n.content}"
                    </p>
                  </div>
                )}
                
                {!n.is_read && (
                  <div className="mt-3 flex items-center gap-1.5 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-primary">Nuevo</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-slate-100/50 rounded-full animate-ping" />
            <Bell size={40} className="text-slate-300 relative z-10" />
          </div>
          <h3 className="text-xl font-serif italic text-brand-ink mb-3 uppercase tracking-tight">Zona en calma</h3>
          <p className="text-[10px] text-brand-muted uppercase font-black tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
            Parece que no hay avisos nuevos por ahora. Todo tranquilo en el vecindario.
          </p>
        </div>
      )}
    </div>
  );
}
