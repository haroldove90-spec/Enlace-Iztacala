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
  XCircle,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Post, Incident, Category, Profile } from './types';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import type { User } from '@supabase/supabase-js';
import { useCommunityData } from './lib/supabase-hooks';
import NewPostModal from './components/NewPostModal';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import PostInteractions from './components/PostInteractions';

// Mock Data
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user_id: 'u1',
    content: 'Informamos a los vecinos que se ha completado el reporte ante el ayuntamiento para la reparación de las luminarias frente al parque. Estaremos monitoreando el progreso durante la semana.',
    category: 'Seguridad',
    created_at: new Date().toISOString(),
    comments_count: 12,
    likes_count: 45,
    has_liked: false,
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
    comments_count: 5,
    likes_count: 28,
    has_liked: false,
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
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('enlace_active_tab') || 'Comunidad';
  });

  useEffect(() => {
    localStorage.setItem('enlace_active_tab', activeTab);
  }, [activeTab]);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'post' | 'incident'>('post');

  const { posts, incidents, loading: dbLoading } = useCommunityData(user?.id);

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
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-brand-bg text-brand-ink selection:bg-brand-primary/20">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-50">
        <div className="flex items-center gap-3">
          <img 
            src="https://appdesignproyectos.com/enlaceiztacala.png" 
            alt="Logo" 
            className="w-10"
            referrerPolicy="no-referrer"
          />
          <span className="font-serif font-bold text-lg leading-none">Iztacala</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-brand-muted hover:text-brand-primary transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar / Overlay Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={window.innerWidth < 768 ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`
              fixed md:relative inset-y-0 left-0 w-[280px] md:w-[300px] lg:w-[320px] 
              border-r border-slate-200 bg-white p-8 md:p-10 flex flex-col justify-between 
              shrink-0 z-[60] md:z-10 transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
          >
            <div>
              <header className="hidden md:block mb-12">
                <img 
                  src="https://appdesignproyectos.com/enlaceiztacala.png" 
                  alt="Logo" 
                  className="w-20 mb-4"
                  referrerPolicy="no-referrer"
                />
                <h1 className="brand-title">Enlace<br />Iztacala</h1>
                <p className="brand-subtitle">Red Comunitaria Boutique</p>
              </header>

              <nav className="space-y-4 md:space-y-6">
                <SidebarItem 
                  icon={<Users size={18} />} 
                  label="Comunidad" 
                  active={activeTab === 'Comunidad'} 
                  onClick={() => { setActiveTab('Comunidad'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<Shield size={18} />} 
                  label="Seguridad" 
                  active={activeTab === 'Seguridad'} 
                  onClick={() => { setActiveTab('Seguridad'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<Store size={18} />} 
                  label="Comercio Local" 
                  active={activeTab === 'Comercio Local'} 
                  onClick={() => { setActiveTab('Comercio Local'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<Megaphone size={18} />} 
                  label="Servicios Públicos" 
                  active={activeTab === 'Servicios Públicos'} 
                  onClick={() => { setActiveTab('Servicios Públicos'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<UserIcon size={18} />} 
                  label="Mi Perfil" 
                  active={activeTab === 'Mi Perfil'} 
                  onClick={() => { setActiveTab('Mi Perfil'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<Settings size={18} />} 
                  label="Configuración" 
                  active={activeTab === 'Configuración'} 
                  onClick={() => { setActiveTab('Configuración'); setIsSidebarOpen(false); }} 
                />
              </nav>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-200 rounded-full overflow-hidden shrink-0">
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto w-full max-w-[1400px] mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'Mi Perfil' ? (
            <motion.div 
              key="perfil"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProfileView 
                profile={profile} 
                userId={user.id}
                userEmail={user.email} 
                onUpdate={() => fetchProfile(user.id)} 
              />
            </motion.div>
          ) : activeTab === 'Configuración' ? (
            <motion.div 
              key="config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsView />
            </motion.div>
          ) : (
            <motion.div 
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-10 pb-5 border-b border-slate-100">
                <h2 className="text-xl md:text-3xl tracking-tight leading-none">Novedades</h2>
                <button className="text-sm font-medium text-brand-primary flex items-center gap-1 hover:gap-2 transition-all self-start sm:self-auto">
                  Ver todo <ChevronRight size={16} />
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 xl:gap-12">
                {/* Main Feed Section */}
                <section className="space-y-6 md:space-y-10">
                  {dbLoading && posts.length === 0 ? (
                    <div className="flex justify-center py-20">
                      <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map((post) => (
                      <article key={post.id} className="editorial-card flex flex-col group">
                        <div className="flex-1">
                          <span className={`category-pill ${post.category === 'Comercio' ? 'bg-brand-commerce-bg text-brand-commerce' : 'bg-sky-50 text-sky-700'}`}>
                            {post.category}
                          </span>
                          <h3 className="text-lg md:text-xl mb-4 leading-tight group-hover:text-brand-primary transition-colors">
                            {post.content.slice(0, 100)}{post.content.length > 100 ? '...' : ''}
                          </h3>
                          <p className="text-sm md:text-lg leading-relaxed text-slate-600 mb-8">{post.content}</p>
                        </div>
                        <PostInteractions post={post} userId={user.id} />
                      </article>
                    ))
                  ) : (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400">
                      No hay publicaciones hoy. ¡Sé el primero!
                    </div>
                  )}
                </section>

                <aside className="space-y-8">
                  <section className="bg-brand-ink text-brand-bg rounded-[2rem] p-8 flex flex-col min-h-[400px] shadow-xl">
                    <div className="border-b border-white/10 pb-4 mb-8 flex justify-between items-center">
                      <h3 className="serif text-base md:text-lg">Reportes Activos</h3>
                      <span className="text-[10px] tracking-widest font-bold opacity-40">HOY</span>
                    </div>
                    <div className="space-y-6 flex-1">
                      {incidents.length > 0 ? (
                        incidents.map((incident) => (
                          <div key={incident.id} className="pb-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer rounded-lg p-2 -mx-2">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className="text-sm font-semibold leading-tight">{incident.title}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-brand-primary text-white whitespace-nowrap">{incident.status}</span>
                            </div>
                            <p className="text-xs text-white/50 flex items-center gap-1 mb-2"><MapPin size={10} /> {incident.location || 'Sin ubicación'}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-white/30 text-center py-10 italic">Sin reportes activos.</p>
                      )}
                    </div>
                    <button 
                      onClick={() => { setModalType('incident'); setIsModalOpen(true); }}
                      className="mt-8 w-full py-5 bg-brand-primary hover:bg-brand-accent transition-all text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-full flex items-center justify-center gap-3"
                    >
                      <Plus size={18} /> Nuevo Reporte
                    </button>
                  </section>
                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="hidden lg:block fixed bottom-5 right-10 text-[9px] text-brand-muted uppercase tracking-widest font-semibold pointer-events-none">
        Enlace Iztacala • Conectando Los Reyes de forma segura
      </footer>

      {/* Tigger Modal FAB */}
      <button 
        onClick={() => { setModalType('post'); setIsModalOpen(true); }}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-14 h-14 md:w-16 md:h-16 bg-brand-ink text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Global New Item Modal */}
      <NewPostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user.id}
        type={modalType}
      />
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
