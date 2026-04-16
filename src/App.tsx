import { useState, ReactNode } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Post, Incident, Category } from './types';

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-brand-bg text-brand-ink selection:bg-brand-primary/20">
      {/* Sidebar */}
      <aside className="w-[300px] border-r border-slate-200 bg-white p-10 flex flex-col justify-between shrink-0">
        <div>
          <header className="mb-12">
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
              icon={<Settings size={18} />} 
              label="Configuración" 
              active={activeTab === 'Configuración'} 
              onClick={() => setActiveTab('Configuración')} 
            />
          </nav>
        </div>

        <div className="pt-10 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
              <img 
                src="https://picsum.photos/seed/roberto/100/100" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-sm font-semibold">Dr. Roberto Mendoza</p>
              <p className="text-[11px] text-brand-muted">Vecino Verificado • Los Reyes</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
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
              <motion.article 
                key={post.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="editorial-card flex flex-col justify-between"
              >
                <div>
                  <span className={`category-pill ${post.category === 'Comercio' ? 'bg-pink-100 text-pink-700' : ''}`}>
                    {post.category}
                  </span>
                  <h3 className="text-2xl mb-3 leading-snug">{post.content.slice(0, 50)}...</h3>
                  <p className="text-base leading-relaxed text-slate-600 mb-6">
                    {post.content}
                  </p>
                </div>
                
                <footer className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-4 text-xs text-brand-muted font-medium">
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.comment_count}</span>
                    <span className="flex items-center gap-1"><Heart size={14} /> {post.reaction_count}</span>
                    <span>Hace 2 horas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 capitalize">{post.author?.full_name}</span>
                  </div>
                </footer>
              </motion.article>
            ))}

            <article className="bg-brand-commerce-bg border border-pink-200 p-6">
              <span className="category-pill bg-pink-200 text-brand-commerce">Comercio</span>
              <h4 className="text-xl mb-2 text-brand-commerce">Panadería "El Artesano"</h4>
              <p className="text-sm text-slate-600 mb-4">
                Prueba nuestras nuevas conchas de chocolate amargo. Promoción para vecinos este fin de semana.
              </p>
              <div className="text-xs font-bold text-brand-commerce bg-white/50 p-2 inline-block rounded">
                Descuento: 15% con ID de Vecino
              </div>
            </article>
          </section>

          {/* Right Panel Section */}
          <aside className="space-y-8">
            {/* Reporting Section */}
            <section className="bg-brand-ink text-brand-bg p-8 flex flex-col min-h-[400px]">
              <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
                <h3 className="serif text-xl">Reportes Activos</h3>
                <span className="text-[10px] tracking-widest font-bold opacity-40">HOY</span>
              </div>

              <div className="space-y-6 flex-1">
                {MOCK_INCIDENTS.map((incident) => (
                  <div key={incident.id} className="pb-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-semibold">{incident.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        incident.status === 'Resuelto' ? 'bg-emerald-500 text-white' : 'bg-brand-primary text-white'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 flex items-center gap-1">
                      <MapPin size={10} /> {incident.location}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button className="w-full py-4 bg-brand-primary hover:bg-brand-accent transition-colors text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2">
                  <Plus size={18} /> Crear Nuevo Reporte
                </button>
              </div>
            </section>

            {/* Weather / Status / Micro Widgets */}
            <section className="p-6 border border-slate-200 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-brand-primary rounded-full">
                  <Droplets size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight">Suministro de Agua</h4>
                  <p className="text-xs text-brand-muted">Presión normal en todo el circuito</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
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
