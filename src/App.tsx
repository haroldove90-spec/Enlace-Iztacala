import { useState, ReactNode, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Store, 
  Megaphone, 
  Settings, 
  Plus, 
  MessageSquare, 
  Heart,
  Droplets,
  Trash2,
  MapPin,
  ChevronRight,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Post, Incident, Category, Profile } from './types';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import type { User } from '@supabase/supabase-js';

// Mock Data
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user_id: 'u1',
    content: 'Informamos a los vecinos que se ha completado el reporte ante el ayuntamiento para la reparación de las luminarias frente al parque. Estaremos monitoreando el progreso durante la semana.',
    category: 'Seguridad',
    created_at: new Date().toISOString(),
    comment_count: 12,
    reaction_count: 45,
    author: {
      id: 'u1',
      username: '@roberto_m',
      full_name: 'Dr. Roberto Mendoza',
      address_verified: true,
      created_at: ''
    }
  },
  {
    id: '2',
    user_id: 'u2',
    content: 'Prueba nuestras nuevas conchas de chocolate amargo. Promoción para vecinos este fin de semana.',
    category: 'Comercio',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    comment_count: 5,
    reaction_count: 28,
    author: {
      id: 'u2',
      username: '@el_artesano',
      full_name: 'Panadería El Artesano',
      address_verified: true,
      created_at: ''
    }
  }
];

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'i1',
    user_id: 'u3',
    title: 'Fuga de Agua',
    description: 'Fuga considerable en la calle de los Monarcas #14',
    status: 'Reportado',
    location: 'Calle de los Monarcas #14',
    created_at: new Date().toISOString()
  },
  {
    id: 'i2',
    user_id: 'u4',
    title: 'Recolección de Basura',
    description: 'El camión no pasó por la Plaza Central hoy.',
    status: 'Resuelto',
    location: 'Plaza Central',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Comunidad');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  const handleSignOut = () => supabase.auth.signOut();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-brand-bg text-brand-ink selection:bg-brand-primary/20">
      {/* Sidebar */}
      <aside className="w-[300px] border-r border-slate-200 bg-white p-10 flex flex-col justify-between shrink-0">
        <div>
          <header className="mb-12">
            <img 
              src="https://appdesignproyectos.com/enlaceiztacala.png" 
              alt="Logo" 
              className="w-20 mb-4"
              referrerPolicy="no-referrer"
            />
            <h1 className="brand-title">Enlace<br />Iztacala</h1>
            <p className="brand-subtitle">Red Comunitaria Boutique</p>
          </header>

          <nav className="space-y-6">
            <SidebarItem 
              icon={<Users size={18} />} 
              label="Comunidad" 
              active={activeTab === 'Comunidad'} 
              onClick={() => setActiveTab('Comunidad')} 
            />
            <SidebarItem 
              icon={<Shield size={18} />} 
              label="Seguridad" 
              active={activeTab === 'Seguridad'} 
              onClick={() => setActiveTab('Seguridad')} 
            />
            <SidebarItem 
              icon={<Store size={18} />} 
              label="Comercio Local" 
              active={activeTab === 'Comercio Local'} 
              onClick={() => setActiveTab('Comercio Local')} 
            />
            <SidebarItem 
              icon={<Megaphone size={18} />} 
              label="Servicios Públicos" 
              active={activeTab === 'Servicios Públicos'} 
              onClick={() => setActiveTab('Servicios Públicos')} 
            />
            <SidebarItem 
              icon={<UserIcon size={18} />} 
              label="Mi Perfil" 
              active={activeTab === 'Mi Perfil'} 
              onClick={() => setActiveTab('Mi Perfil')} 
            />
            <SidebarItem 
              icon={<Settings size={18} />} 
              label="Configuración" 
              active={activeTab === 'Configuración'} 
              onClick={() => setActiveTab('Configuración')} 
            />
          </nav>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden shrink-0">
              <img 
                src={profile?.avatar_url || `https://picsum.photos/seed/${user.id}/100/100`} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name || user.email}</p>
              <div className="flex items-center gap-1">
                {profile?.address_verified ? (
                  <CheckCircle2 size={10} className="text-emerald-500" />
                ) : (
                  <XCircle size={10} className="text-brand-muted" />
                )}
                <p className="text-[11px] text-brand-muted truncate">
                  {profile?.address_verified ? 'Verificado' : 'No verificado'}
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors w-full"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'Mi Perfil' ? (
            <motion.div 
              key="perfil"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl"
            >
              <header className="mb-10 pb-5 border-b border-slate-100">
                <h2 className="text-4xl leading-none">Mi Perfil</h2>
              </header>

              <div className="editorial-card space-y-8">
                <div className="flex items-center gap-6">
                   <div className="w-24 h-24 bg-slate-100 rounded-full overflow-hidden border-4 border-white shadow-sm shrink-0">
                    <img 
                      src={profile?.avatar_url || `https://picsum.photos/seed/${user.id}/200/200`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl">{profile?.full_name || 'Nuevo Vecino'}</h3>
                    <p className="text-brand-muted">{user.email}</p>
                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      profile?.address_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {profile?.address_verified ? (
                        <><CheckCircle2 size={12} /> Domicilio Verificado</>
                      ) : (
                        <><XCircle size={12} /> Pendiente de Verificación</>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Miembro desde</span>
                    <p className="text-sm font-medium">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Hoy'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Ubicación</span>
                    <p className="text-sm font-medium">Los Reyes Iztacala</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-4">Configuración de la Cuenta</span>
                  <div className="space-y-3">
                    <button className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium flex items-center justify-between">
                      Notificaciones de Seguridad <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium flex items-center justify-between">
                      Verificar Domicilio <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <header className="flex justify-between items-end mb-10 pb-5 border-b border-slate-100">
                <h2 className="text-4xl leading-none">Novedades del Vecindario</h2>
                <button className="text-sm font-medium text-brand-primary flex items-center gap-1 hover:gap-2 transition-all">
                  Ver todo <ChevronRight size={16} />
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
                {/* Main Feed Section */}
                <section className="space-y-8">
                  {MOCK_POSTS.map((post) => (
                    <article key={post.id} className="editorial-card flex flex-col justify-between">
                      <div>
                        <span className={`category-pill ${post.category === 'Comercio' ? 'bg-pink-100 text-pink-700' : ''}`}>
                          {post.category}
                        </span>
                        <h3 className="text-2xl mb-3 leading-snug">{post.content.slice(0, 50)}...</h3>
                        <p className="text-base leading-relaxed text-slate-600 mb-6">{post.content}</p>
                      </div>
                      <footer className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-4 text-xs text-brand-muted font-medium">
                          <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.comment_count}</span>
                          <span className="flex items-center gap-1"><Heart size={14} /> {post.reaction_count}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 capitalize">{post.author?.full_name}</span>
                      </footer>
                    </article>
                  ))}
                </section>

                <aside className="space-y-8">
                  <section className="bg-brand-ink text-brand-bg p-8 flex flex-col min-h-[400px]">
                    <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
                      <h3 className="serif text-xl">Reportes Activos</h3>
                      <span className="text-[10px] tracking-widest font-bold opacity-40">HOY</span>
                    </div>
                    <div className="space-y-6 flex-1">
                      {MOCK_INCIDENTS.map((incident) => (
                        <div key={incident.id} className="pb-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-semibold">{incident.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-brand-primary text-white">{incident.status}</span>
                          </div>
                          <p className="text-xs text-white/50 flex items-center gap-1"><MapPin size={10} /> {incident.location}</p>
                        </div>
                      ))}
                    </div>
                    <button className="mt-8 w-full py-4 bg-brand-primary hover:bg-brand-accent transition-colors text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2">
                      <Plus size={18} /> Crear Nuevo Reporte
                    </button>
                  </section>
                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-5 right-10 text-[10px] text-brand-muted italic pointer-events-none">
        Enlace Iztacala • Conectando Los Reyes Iztacala de forma segura y elegante.
      </footer>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`sidebar-link ${active ? 'active' : ''}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="tracking-tight">{label}</span>
      {active && <motion.div layoutId="activeDot" className="w-1.5 h-1.5 bg-brand-primary rounded-full ml-auto" />}
    </div>
  );
}
