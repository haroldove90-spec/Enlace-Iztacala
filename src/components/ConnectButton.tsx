import React, { useState } from 'react';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';
import { useFriendships } from '../lib/supabase-friendships';
import { motion, AnimatePresence } from 'motion/react';

interface ConnectButtonProps {
  currentUserId: string;
  targetUserId: string;
}

export default function ConnectButton({ currentUserId, targetUserId }: ConnectButtonProps) {
  const { 
    friends, 
    receivedRequests, 
    sentRequests, 
    sendRequest, 
    updateRequestStatus, 
    loading: friendshipsLoading 
  } = useFriendships(currentUserId);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (currentUserId === targetUserId) return null;

  // Encontrar estado de amistad
  // 1. Amigos aceptados
  const friendship = friends.find(f => 
    (f.user_id === currentUserId && f.friend_id === targetUserId) || 
    (f.user_id === targetUserId && f.friend_id === currentUserId)
  );
  
  // 2. Solicitud enviada por mí
  const sent = sentRequests.find(f => f.friend_id === targetUserId);

  // 3. Solicitud recibida por mí
  const received = receivedRequests.find(r => r.user_id === targetUserId);

  const handleConnect = async () => {
    if (friendship || sent || received) return;
    
    setIsActionLoading(true);
    try {
      await sendRequest(targetUserId);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!received) return;
    setIsActionLoading(true);
    try {
      await updateRequestStatus(received.id, 'Accepted');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error accepting friendship:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (friendship) {
    return (
      <button 
        disabled 
        className="w-full py-3.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-emerald-100 cursor-default"
      >
        <UserCheck size={14} /> Amigos
      </button>
    );
  }

  if (sent) {
    return (
      <button 
        disabled 
        className="w-full py-3.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-slate-100 cursor-default"
      >
        <Clock size={14} /> Solicitud Enviada
      </button>
    );
  }

  if (received) {
    return (
      <div className="w-full p-2 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 text-center">
        <p className="text-[9px] text-brand-primary font-bold uppercase tracking-widest mb-2">Te envió solicitud</p>
        <button 
          onClick={handleAccept}
          disabled={isActionLoading}
          className="w-full py-2 bg-brand-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-ink transition-all flex items-center justify-center gap-2"
        >
          {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Aceptar Conexión'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button 
        onClick={handleConnect}
        disabled={isActionLoading || friendshipsLoading}
        className="w-full py-3.5 bg-brand-ink hover:bg-brand-primary text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
      >
        {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Conectar</>}
      </button>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full whitespace-nowrap z-50 shadow-xl"
          >
            Solicitud enviada con éxito ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
