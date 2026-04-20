import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Send, Loader2, User, Bookmark, BookmarkCheck, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toggleLike, addComment, getComments, toggleFavorite } from '../lib/supabase-hooks';
import type { Post, Comment } from '../types';
import { toast } from 'react-hot-toast';

interface PostInteractionsProps {
  post: Post;
  userId: string;
}

export default function PostInteractions({ post, userId }: PostInteractionsProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);

  const handleLike = async () => {
    try {
      await toggleLike(post.id, userId, !!post.has_liked);
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleFavorite = async () => {
    try {
      await toggleFavorite(post.id, userId, !!post.is_favorite);
      toast.success(post.is_favorite ? 'Eliminado de guardados' : 'Guardado en tu perfil');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar publicación');
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      setShowComments(true);
      try {
        const data = await getComments(post.id);
        setComments(data);
      } catch (error) {
        console.error('Error al cargar comentarios:', error);
      } finally {
        setLoadingComments(false);
      }
    } else {
      setShowComments(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      await addComment(post.id, userId, newComment);
      setNewComment('');
      // Recargar comentarios
      const data = await getComments(post.id);
      setComments(data);
    } catch (error) {
      console.error('Error al enviar comentario:', error);
    } finally {
      setSendingComment(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Enlace copiado al portapapeles');
  };

  return (
    <div className="w-full">
      {/* Interaction Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100 mb-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-xs font-medium transition-all group ${
              post.has_liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
            }`}
          >
            <Heart 
              size={18} 
              className={post.has_liked ? 'fill-current' : 'group-hover:scale-110 transition-transform'} 
            />
            <span>{post.likes_count || 0}</span>
          </button>

          <button 
            onClick={handleToggleComments}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-primary transition-all group"
          >
            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
            <span>{post.comments_count || 0}</span>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-primary transition-all group"
          >
            <Share2 size={18} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleFavorite}
            className={`flex items-center gap-2 text-xs font-medium transition-all group ${
              post.is_favorite ? 'text-brand-primary' : 'text-slate-500 hover:text-brand-primary'
            }`}
            title={post.is_favorite ? "Quitar de guardados" : "Guardar publicación"}
          >
            {post.is_favorite ? <BookmarkCheck size={20} className="fill-current" /> : <Bookmark size={20} className="group-hover:scale-110 transition-transform" />}
          </button>
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {post.author?.full_name || 'Vecino'}
          </span>
        </div>
      </div>

      {/* Media Preview (If exists) */}
      {post.image_url && (
        <div 
          className="mb-6 rounded-[1.5rem] overflow-hidden bg-slate-100 flex items-center justify-center min-h-[200px] border border-slate-200 shadow-inner group/media cursor-pointer relative"
          onClick={() => setIsFullImageOpen(true)}
        >
          <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/5 transition-all flex items-center justify-center opacity-0 group-hover/media:opacity-100 z-10">
            <div className="bg-white/80 p-3 rounded-full backdrop-blur-md shadow-xl">
              <Maximize2 size={24} className="text-brand-ink" />
            </div>
          </div>
          {post.image_url.match(/\.(mp4|webm|ogg)$/) ? (
            <video 
              src={post.image_url} 
              controls 
              className="w-full max-h-[600px] object-contain"
            />
          ) : (
            <img 
              src={post.image_url} 
              alt="Post media" 
              className="w-full max-h-[600px] object-contain"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      )}

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {isFullImageOpen && post.image_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-4 md:p-10"
            onClick={() => setIsFullImageOpen(false)}
          >
            <button 
              className="absolute top-6 right-6 md:top-10 md:right-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20"
              onClick={() => setIsFullImageOpen(false)}
            >
              <X size={24} />
            </button>
            <div className="flex-1 flex items-center justify-center relative">
              <img 
                src={post.image_url} 
                className="max-w-full max-h-full object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 rounded-2xl -mx-4 px-4"
          >
            <div className="py-6 space-y-6">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-slate-300" size={20} />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-200">
                        <img 
                          src={comment.author?.avatar_url || `https://picsum.photos/seed/${comment.user_id}/100/100`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                          <p className="text-[11px] font-bold text-brand-ink mb-1">
                            {comment.author?.full_name || 'Vecino'}
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 ml-1 font-medium">
                          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center text-slate-400 italic py-4">Sé el primero en comentar...</p>
              )}

              {/* Add Comment Input */}
              <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full bg-white border border-slate-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={sendingComment || !newComment.trim()}
                  className="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {sendingComment ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
