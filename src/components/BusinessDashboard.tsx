import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  Image as ImageIcon, 
  CreditCard, 
  Megaphone, 
  Layout, 
  Save, 
  Loader2, 
  CheckCircle,
  ExternalLink,
  Tag
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/supabase-hooks';
import type { Business, Payment } from '../types';

export default function BusinessDashboard({ userId }: { userId: string }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [bizName, setBizName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    const { data, error } = await supabase
      .from('business_directory')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setBusiness(data);
      setBizName(data.business_name);
      setDescription(data.description);
    }
    setLoading(false);
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    const { error } = await supabase
      .from('business_directory')
      .upsert({
        user_id: userId,
        business_name: bizName,
        description: description,
        updated_at: new Date().toISOString()
      });

    if (!error) fetchBusiness();
    setSaveLoading(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSaveLoading(true);
      try {
        const publicUrl = await uploadFile('banners', e.target.files[0], userId);
        await supabase
          .from('business_directory')
          .update({ banner_url: publicUrl })
          .eq('user_id', userId);
        fetchBusiness();
      } catch (err) {
        console.error(err);
      } finally {
        setSaveLoading(false);
      }
    }
  };

  const handleSimulatePayment = async () => {
    setPayLoading(true);
    // Simulamos un delay de pasarela de pago
    await new Promise(r => setTimeout(r, 2000));

    if (!business) {
      // Si no existe el negocio lo creamos primero
      const { data } = await supabase.from('business_directory').insert([{
        user_id: userId,
        business_name: bizName || 'Mi Negocio',
        description: description || 'Sin descripción',
        payment_status: 'Paid'
      }]).select().single();
      
      if (data) {
        await supabase.from('payments').insert([{
          business_id: data.id,
          amount: 100,
          status: 'Paid',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }]);
      }
    } else {
      await supabase.from('business_directory').update({ payment_status: 'Paid' }).eq('id', business.id);
      await supabase.from('payments').insert([{
        business_id: business.id,
        amount: 100,
        status: 'Paid',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]);
    }

    fetchBusiness();
    setPayLoading(false);
    alert('¡Suscripción Comercial Activada! Tu banner será visible en el directorio.');
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl brand-title">Centro de Negocios Iztacala</h2>
          <p className="brand-subtitle mt-2">Gestiona tu presencia comercial y activa promociones locales.</p>
        </div>
        <div className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${
          business?.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          Status: {business?.payment_status || 'Pendiente'}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12">
        {/* Banner & General Info */}
        <section className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="relative h-56 bg-slate-100 group">
              {business?.banner_url ? (
                <img src={business.banner_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <ImageIcon size={40} className="opacity-20" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">Sin Banner Publicitario</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  className="bg-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <ImageIcon size={14} /> Subir Banner
                </button>
                <input type="file" hidden ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" />
              </div>
            </div>

            <form onSubmit={handleUpdateBusiness} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Nombre del Comercio</label>
                <input 
                  type="text" 
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full py-4 bg-transparent border-b border-slate-100 text-2xl font-serif focus:border-brand-primary outline-none transition-all"
                  placeholder="Ej: Panadería El Artesano"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Descripción Boutique</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full py-4 bg-transparent border-b border-slate-100 text-lg font-serif italic focus:border-brand-primary outline-none transition-all resize-none"
                  placeholder="Cuenta la historia de tu comercio..."
                />
              </div>
              <div className="flex justify-end">
                <button 
                  disabled={saveLoading}
                  className="px-10 py-4 bg-brand-ink text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all flex items-center gap-2"
                >
                  {saveLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={14} /> Guardar Cambios</>}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-emerald-50 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 border border-emerald-100">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
              <Tag size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-xl font-serif text-emerald-900 mb-1">Crea tu primera promoción</h4>
              <p className="text-sm text-emerald-700/70 italic">Los cupones aparecen en la pantalla de inicio de todos los vecinos.</p>
            </div>
            <button className="px-8 py-3 bg-emerald-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all">
              Crear Cupón
            </button>
          </div>
        </section>

        {/* Payment & Stats Aside */}
        <aside className="space-y-8">
          <div className="bg-brand-ink text-white rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-brand-primary" /> Suscripción
            </h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                <span className="opacity-50">Acceso al Directorio</span>
                <span className="font-bold">Facturado Mensual</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Costo de Activación</p>
                  <p className="text-3xl font-serif">$100.00 MXN</p>
                </div>
                {business?.payment_status === 'Paid' && (
                  <div className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest mb-1">
                    <CheckCircle size={14} /> Activo
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSimulatePayment}
              disabled={payLoading || business?.payment_status === 'Paid'}
              className={`w-full py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                business?.payment_status === 'Paid' 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-brand-primary text-white hover:bg-brand-accent shadow-lg shadow-brand-primary/20'
              }`}
            >
              {payLoading ? <Loader2 className="animate-spin" size={20} /> : <><Layout size={18} /> Activar Publicidad</>}
            </button>
            <p className="text-[9px] text-center mt-6 text-white/30 uppercase tracking-[0.2em]">Pago seguro vía IztacalaPay Demo</p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-6">Impacto Comercial</h4>
            <div className="space-y-6">
              <MetricRow label="Visualizaciones de Banner" value="0" />
              <MetricRow label="Clicks en Comercio" value="0" />
              <MetricRow label="Cupones Canjeados" value="0" />
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50">
              <button className="text-[10px] uppercase tracking-widest font-bold text-brand-primary flex items-center gap-2 hover:gap-3 transition-all">
                Ver analíticas detalladas <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-brand-muted font-serif italic">{label}</span>
      <span className="text-xl font-bold text-brand-ink">{value}</span>
    </div>
  );
}
