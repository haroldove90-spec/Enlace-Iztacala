import React, { useState, useRef } from 'react';
import { Camera, ShieldCheck, Mail, User, Info, Loader2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/supabase-hooks';
import type { Profile } from '../types';

interface ProfileViewProps {
  profile: Profile | null;
  userEmail: string | undefined;
  onUpdate: () => void;
}

export default function ProfileView({ profile, userEmail, onUpdate }: ProfileViewProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
        })
        .eq('id', profile.id);

      if (error) throw error;
      onUpdate();
      alert('Perfil actualizado con éxito');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profile) {
      const file = e.target.files[0];
      setAvatarLoading(true);

      try {
        const publicUrl = await uploadFile('avatars', file, profile.id);
        
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        if (error) throw error;
        onUpdate();
        alert('Foto de perfil actualizada');
      } catch (error) {
        console.error('Error al subir avatar:', error);
        alert('Error al subir la foto. Verifica que el bucket "avatars" exista en Supabase.');
      } finally {
        setAvatarLoading(false);
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
    <div className="max-w-3xl space-y-12">
      <header className="mb-10 pb-5 border-b border-slate-100">
        <h2 className="text-xl md:text-3xl tracking-tight leading-none text-brand-ink">Mi Perfil</h2>
        <p className="text-sm text-brand-muted mt-2">Gestiona tu identidad y seguridad en la comunidad.</p>
      </header>

      {/* Profile Info Section */}
      <section className="editorial-card overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white shadow-md ring-1 ring-slate-100 group-hover:brightness-90 transition-all cursor-pointer flex items-center justify-center"
              >
                {avatarLoading ? (
                  <Loader2 className="animate-spin text-brand-primary" size={24} />
                ) : (
                  <img 
                    src={profile?.avatar_url || `https://picsum.photos/seed/${profile?.id}/200/200`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                )}
                <input 
                  type="file" 
                  hidden 
                  ref={avatarInputRef} 
                  onChange={handleAvatarChange}
                  accept="image/*"
                />
              </div>
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-brand-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={14} />
              </button>
            </div>
            <div>
              <h3 className="text-2xl font-serif text-brand-ink">{profile?.full_name || 'Vecino'}</h3>
              <p className="text-sm text-brand-muted flex items-center gap-1"><Mail size={12} /> {userEmail}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            profile?.address_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {profile?.address_verified ? (
              <span className="flex items-center gap-2"><ShieldCheck size={14} /> Verificado</span>
            ) : (
              <span className="flex items-center gap-2"><Info size={14} /> Pendiente</span>
            )}
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Nombre de Usuario</label>
              <input 
                type="text" 
                disabled 
                value={profile?.username || ''} 
                className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm italic text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Biografía / Presentación</label>
            <textarea 
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a tus vecinos un poco sobre ti..."
              className="w-full p-6 bg-slate-50 border-none rounded-[2rem] text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-brand-ink text-white rounded-full font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={14} /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </section>

      {/* Security Section */}
      <section className="editorial-card p-10 space-y-8">
        <header>
          <h4 className="text-lg font-serif">Seguridad de la Cuenta</h4>
          <p className="text-sm text-brand-muted">Actualiza tu contraseña periódicamente.</p>
        </header>

        <form onSubmit={handleUpdatePassword} className="max-w-md space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Nueva Contraseña</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={passwordLoading}
            className="w-full py-4 border border-brand-ink text-brand-ink font-bold text-[10px] uppercase tracking-widest rounded-full hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {passwordLoading ? <Loader2 className="animate-spin" size={16} /> : 'Actualizar Contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
}
