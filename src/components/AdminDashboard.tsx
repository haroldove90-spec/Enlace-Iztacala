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
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, Business, Payment } from '../types';

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: bData } = await supabase.from('business_directory').select('*, owner:profiles(*)');
    const { data: payData } = await supabase.from('payments').select('*');

    if (pData) setProfiles(pData);
    if (bData) setBusinesses(bData);
    if (payData) setPayments(payData);
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
