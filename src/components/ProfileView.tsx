import React, { useState, useRef } from 'react';
import { Camera, ShieldCheck, Mail, User, Info, Loader2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/supabase-hooks';
import type { Profile } from '../types';

interface ProfileViewProps {
  profile: Profile | null;
  userId: string;
  userEmail: string | undefined;
  onUpdate: () => void;
}

export default function ProfileView({ profile, userId, userEmail, onUpdate }: ProfileViewProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // Actualizar el estado local cuando el perfil cargue
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          bio: bio,
          username: profile?.username || userEmail?.split('@')[0], // Fallback por si no existe
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      onUpdate();
      alert('Perfil actualizado con éxito');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar perfil. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarLoading(true);

      try {
        const publicUrl = await uploadFile('avatars', file, userId);
        
        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId,
            avatar_url: publicUrl,
            username: profile?.username || userEmail?.split('@')[0],
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        onUpdate();
      } catch (error: any) {
        console.error('Error al subir avatar:', error);
        alert(`Error al subir la foto: ${error.message}`);
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverLoading(true);

      try {
        const publicUrl = await uploadFile('covers', file, userId);
        
        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId,
            cover_url: publicUrl,
            username: profile?.username || userEmail?.split('@')[0],
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        onUpdate();
      } catch (error: any) {
        console.error('Error al subir portada:', error);
        alert(`Error al subir la portada: ${error.message}. Asegúrate de crear el bucket "covers" en Supabase.`);
      } finally {
        setCoverLoading(false);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setNewPassword('');
      alert('Contraseña actualizada con éxito');
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      alert('Error al actualizar contraseña. Recuerda que debe ser de al menos 6 caracteres.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="mb-6">
        <h2 className="text-2xl md:text-4xl brand-title leading-tight">Identidad Vecinal</h2>
        <p className="brand-subtitle mt-2">Personaliza cómo te ven tus vecinos en Iztacala.</p>
      </header>

      {/* Profile Visual Identity (FB/LinkedIn Style) */}
      <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 md:h-72 bg-slate-100 group">
          {coverLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-brand-primary" />
            </div>
          ) : (
            <img 
              src={profile?.cover_url || "https://picsum.photos/seed/iztacala-cover/1200/400?blur=2"} 
              alt="Portada" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <button 
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-6 right-6 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2"
          >
            <Camera size={14} /> Editar Portada
          </button>
          <input type="file" hidden ref={coverInputRef} onChange={handleCoverChange} accept="image/*" />
        </div>

        {/* Avatar & Basic Info Overlay */}
        <div className="px-8 md:px-12 pb-10 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20 mb-8">
            <div className="relative group/avatar">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                className="w-32 h-32 md:w-44 md:h-44 bg-white rounded-full overflow-hidden border-8 border-white shadow-xl ring-1 ring-slate-100 cursor-pointer"
              >
                {avatarLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <Loader2 className="animate-spin text-brand-primary" size={32} />
                  </div>
                ) : (
                  <img 
                    src={profile?.avatar_url || `https://picsum.photos/seed/${userId}/300/300`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover group-hover/avatar:brightness-90 transition-all"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-brand-primary text-white p-2.5 md:p-3 rounded-full shadow-2xl hover:scale-110 transition-transform z-10"
              >
                <Camera size={16} />
              </button>
              <input type="file" hidden ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" />
            </div>

            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-3xl md:text-5xl brand-title font-medium">{profile?.full_name || 'Vecino'}</h3>
                {profile?.address_verified && (
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100">
                    <ShieldCheck size={14} /> Verificado
                  </div>
                )}
              </div>
              <p className="text-brand-muted text-base md:text-xl flex items-center gap-2 font-serif italic">
                {profile?.username ? `@${profile.username}` : userEmail}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="grid lg:grid-cols-3 gap-12 pt-8 border-t border-slate-50">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-primary" size={16} />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-8 pr-4 py-4 bg-transparent border-b border-slate-100 focus:border-brand-primary focus:ring-0 outline-none transition-all text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Email de Contacto</label>
                  <p className="px-0 py-4 text-brand-ink/60 font-mono text-sm">{userEmail}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Biografía / Presentación</label>
                <textarea 
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntale a tus vecinos un poco sobre ti..."
                  className="w-full p-0 py-4 bg-transparent border-b border-slate-100 focus:border-brand-primary focus:ring-0 outline-none transition-all resize-none text-lg font-serif italic leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-ink mb-6 opacity-60">Acciones de Cuenta</h4>
                <div className="space-y-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-brand-ink text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={14} /> Guardar Cambios</>}
                  </button>
                  
                  <div className="pt-6 mt-6 border-t border-slate-200">
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-4">Actualizar Seguridad</p>
                    <input 
                      type="password" 
                      placeholder="Nueva contraseña"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs mb-3 outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <button 
                      type="button"
                      onClick={handleUpdatePassword}
                      disabled={passwordLoading || !newPassword}
                      className="w-full py-3 bg-white border border-slate-200 text-brand-ink rounded-full font-bold text-[9px] uppercase tracking-widest hover:border-brand-ink transition-all disabled:opacity-30"
                    >
                      Restablecer Acceso
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
