import React from 'react';
import { UserPlus, UserCheck, Clock, ShieldAlert } from 'lucide-react';
import { useFriendships } from '../lib/supabase-friendships';

interface FriendshipButtonsProps {
  currentUserId: string;
  targetUserId: string;
}

export default function FriendshipButtons({ currentUserId, targetUserId }: FriendshipButtonsProps) {
  const { friends, requests, sendRequest } = useFriendships(currentUserId);
  const [loading, setLoading] = React.useState(false);

  if (currentUserId === targetUserId) return null;

  const friendship = friends.find(f => f.friend_id === targetUserId || f.user_id === targetUserId);
  const pendingRequest = requests.find(r => r.user_id === targetUserId && r.status === 'Pending');
  const sentRequest = !friendship && !pendingRequest && friends.find(f => f.friend_id === targetUserId && f.status === 'Pending');

  const handleAction = async () => {
    setLoading(true);
    try {
      await sendRequest(targetUserId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (friendship) {
    return (
      <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-100">
        <UserCheck size={14} /> Amigos
      </button>
    );
  }

  if (pendingRequest) {
    return (
      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
        Pendiente de aceptar
      </p>
    );
  }

  return (
    <button 
      onClick={handleAction}
      disabled={loading || !!sentRequest}
      className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
        sentRequest 
        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default' 
        : 'bg-brand-ink text-white hover:bg-brand-primary'
      }`}
    >
      {sentRequest ? (
        <><Clock size={14} /> Solicitud Enviada</>
      ) : (
        <><UserPlus size={14} /> Conectar</>
      )}
    </button>
  );
}
