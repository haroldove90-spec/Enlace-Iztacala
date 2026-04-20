import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  CreditCard, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search, 
  TrendingUp,
  ShieldAlert,
  Loader2,
  MessageSquare,
  Heart,
  Megaphone,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, Business, Payment, SiteBanner } from '../types';
import { uploadFile } from '../lib/supabase-hooks';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', link_url: '', file: null as File | null });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    likes: 0,
    comments: 0,
    incidents: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: bData } = await supabase.from('business_directory').select('*, owner:profiles(*)');
    const { data: payData } = await supabase.from('payments').select('*');
    const { data: bDataBanners } = await supabase.from('site_banners').select('*').order('created_at', { ascending: false });
    
    // Métricas de interacción
    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    const { count: likeCount } = await supabase.from('likes').select('*', { count: 'exact', head: true });
    const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true });
    const { count: incidentCount } = await supabase.from('incidents').select('*', { count: 'exact', head: true });

    if (pData) setProfiles(pData);
    if (bData) setBusinesses(bData);
    if (payData) setPayments(payData);
    if (bDataBanners) setBanners(bDataBanners);
    setStats({
      posts: postCount || 0,
      likes: likeCount || 0,
      comments: commentCount || 0,
      incidents: incidentCount || 0
    });
    setLoading(false);
  };

  const toggleUserStatus = async (user: Profile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);
    
    if (!error) fetchData();
  };

  const handleModerateBusiness = async (businessId: string, status: 'Paid' | 'Pending' | 'Expired') => {
    const { error } = await supabase
      .from('business_directory')
      .update({ payment_status: status })
      .eq('id', businessId);
    
    if (!error) fetchData();
  };

  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.file) {
      toast.error('Por favor selecciona una imagen para el banner');
      return;
    }

    setUploadingBanner(true);
    const loadingToast = toast.loading('Subiendo banner publicitario...');

    try {
      const publicUrl = await uploadFile('banners', newBanner.file, 'admin');
      
      const { error } = await supabase
        .from('site_banners')
        .insert([{
          title: newBanner.title || 'Anuncio',
          link_url: newBanner.link_url,
          image_url: publicUrl,
          position: 'header'
        }]);

      if (error) throw error;

      toast.success('Banner publicado exitosamente', { id: loadingToast });
      setIsBannerModalOpen(false);
      setNewBanner({ title: '', link_url: '', file: null });
      fetchData();
    } catch (err: any) {
      toast.error('Error al subir banner: ' + err.message, { id: loadingToast });
    } finally {
      setUploadingBanner(false);
    }
  };

  const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('site_banners')
      .update({ is_active: !currentStatus })
      .eq('id', bannerId);
    
    if (!error) fetchData();
  };

  const deleteBanner = async (bannerId: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;
    const { error } = await supabase.from('site_banners').delete().eq('id', bannerId);
    if (!error) fetchData();
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl brand-title">Panel de Control Gubernamental</h2>
        <p className="brand-subtitle mt-2">Gestión de comunidad, moderación y economía de Iztacala.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Users size={20} />} label="Vecinos Registrados" value={profiles.length} color="blue" />
        <StatCard icon={<Store size={20} />} label="Comercios Locales" value={businesses.length} color="amber" />
        <StatCard icon={<CreditCard size={20} />} label="Ingresos Totales" value={`$${totalRevenue.toLocaleString()} MXN`} color="emerald" />
        <StatCard icon={<ShieldAlert size={20} />} label="Vecinos Inactivos" value={profiles.filter(p => !p.is_active).length} color="rose" />
      </div>

      {/* Community Interaction Stats */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-brand-primary" size={24} />
          <h3 className="text-xl font-serif">Impacto y Vida Comunitaria</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard icon={<MessageSquare size={18} />} label="Publicaciones" value={stats.posts} color="blue" />
          <StatCard icon={<Heart size={18} />} label="Likes Reales" value={stats.likes} color="rose" />
          <StatCard icon={<Megaphone size={18} />} label="Conversaciones" value={stats.comments} color="amber" />
          <StatCard icon={<ShieldAlert size={18} />} label="Reportes" value={stats.incidents} color="rose" />
        </div>
      </section>

      {/* Revenue & Economy Section */}
      <section className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif">Economía Circular Iztacala</h3>
            <p className="text-slate-400 text-sm italic font-serif leading-relaxed max-w-md">
              Monitoreo de ingresos por suscripciones comerciales y activación de banners publicitarios.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary mb-2">Fondo Comunitario Acumulado</p>
            <p className="text-5xl font-serif text-white">${totalRevenue.toLocaleString()} <span className="text-xl text-slate-500">MXN</span></p>
          </div>
        </div>
      </section>

      {/* Corporate Banners Management */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-serif">Banners de Cabecera (Home)</h3>
            <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest mt-1">Gestión de publicidad global</p>
          </div>
          <button 
            onClick={() => setIsBannerModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={14} /> Nuevo Banner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map(banner => (
            <div key={banner.id} className="editorial-card !p-4 flex flex-col gap-4 group">
              <div className="aspect-[21/9] rounded-2xl overflow-hidden relative">
                <img src={banner.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                  banner.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {banner.is_active ? 'Activo' : 'Pausado'}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm">{banner.title}</h4>
                <p className="text-[10px] text-slate-400 truncate">{banner.link_url || 'Sin enlace'}</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-50 mt-auto">
                <button 
                  onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    banner.is_active ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {banner.is_active ? 'Pausar' : 'Activar'}
                </button>
                <button 
                  onClick={() => deleteBanner(banner.id)}
                  className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
              <p className="text-slate-300 font-serif italic">No hay banners configurados</p>
            </div>
          )}
        </div>
      </section>

      {/* Banner Creation Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-ink/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Nuevo Banner Publicitario</h3>
            <form onSubmit={handleCreateBanner} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 block">Imagen del Banner (Recomendado 21:9)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setNewBanner({ ...newBanner, file: e.target.files?.[0] || null })}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 block">Título (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej: Gran Inauguración"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm outline-none ring-1 ring-slate-100 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 block">Link de Destino</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={newBanner.link_url}
                  onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm outline-none ring-1 ring-slate-100 focus:ring-brand-primary"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-brand-ink transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={uploadingBanner}
                  className="flex-1 bg-brand-primary text-white py-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {uploadingBanner ? 'Subiendo...' : 'Publicar Banner'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-12">
        {/* User Management */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-serif">Gestión de Vecinos</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar vecino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-50 text-slate-400 uppercase tracking-widest font-bold">
                  <th className="pb-4">Vecino</th>
                  <th className="pb-4">Rol</th>
                  <th className="pb-4">Estado</th>
                  <th className="pb-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.avatar_url || `https://picsum.photos/seed/${p.id}/50/50`} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold">{p.full_name}</p>
                          <p className="opacity-50 italic">@{p.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4"><span className="px-2 py-1 bg-slate-100 rounded-full">{p.role}</span></td>
                    <td className="py-4">
                      {p.is_active ? 
                        <span className="text-emerald-500 font-bold">Activo</span> : 
                        <span className="text-rose-500 font-bold">Inactivo</span>
                      }
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => toggleUserStatus(p)}
                        className={`p-2 rounded-lg transition-all ${p.is_active ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        {p.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Business Moderation */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <h3 className="text-xl font-serif mb-8">Moderación de Comercios</h3>
          <div className="space-y-6">
            {businesses.map(b => (
              <div key={b.id} className="flex gap-4 p-4 rounded-3xl border border-slate-50 hover:border-brand-primary/20 transition-all">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                  <img src={b.banner_url || "https://picsum.photos/seed/iztacala-biz/150/150"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{b.business_name}</h4>
                  <p className="text-[10px] text-brand-muted truncate mb-2">Por: {b.owner?.full_name}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${
                    b.payment_status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {b.payment_status}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleModerateBusiness(b.id, 'Paid')}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button 
                    onClick={() => handleModerateBusiness(b.id, 'Expired')}
                    className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className={`p-6 rounded-[2rem] border border-slate-100 shadow-sm bg-white`}>
      <div className={`w-10 h-10 rounded-2xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{label}</p>
      <p className="text-xl md:text-2xl brand-title">{value}</p>
    </div>
  );
}
