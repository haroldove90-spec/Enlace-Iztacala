import { useState } from 'react';
import { Bell, Shield, Eye, Smartphone, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsView() {
  const [notifications, setNotifications] = useState({
    security: true,
    social: true,
    commerce: false,
    publicServices: true
  });
  const [updating, setUpdating] = useState(false);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUpdateSettings = async () => {
    setUpdating(true);
    // Simulación de llamada a Edge Function para persistir preferencias
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUpdating(false);
    alert('Configuración guardada correctamente.');
  };

  return (
    <div className="max-w-2xl space-y-12">
      <header className="mb-10 pb-5 border-b border-slate-100">
        <h2 className="text-xl md:text-3xl tracking-tight leading-none text-brand-ink">Configuración</h2>
        <p className="text-sm text-brand-muted mt-2">Personaliza tu experiencia y gestiona tus avisos.</p>
      </header>

      {/* Notifications Section */}
      <section className="space-y-6">
        <header className="flex items-center gap-3 text-brand-ink mb-8">
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
            <Bell size={20} />
          </div>
          <div>
            <h4 className="font-serif text-lg leading-tight">Notificaciones</h4>
            <p className="text-xs text-brand-muted">Recibe avisos directos en tu dispositivo.</p>
          </div>
        </header>

        <div className="editorial-card divide-y divide-slate-50">
          <SettingToggle 
            label="Seguridad y Emergencias" 
            sub="Alertas inmediatas de la colonia" 
            active={notifications.security} 
            onToggle={() => toggleNotification('security')}
          />
          <SettingToggle 
            label="Actividad Social" 
            sub="Nuevos posts y comentarios de vecinos" 
            active={notifications.social} 
            onToggle={() => toggleNotification('social')}
          />
          <SettingToggle 
            label="Comercio y Ofertas" 
            sub="Descuentos exclusivos de locales" 
            active={notifications.commerce} 
            onToggle={() => toggleNotification('commerce')}
          />
          <SettingToggle 
            label="Servicios Públicos" 
            sub="Cortes de agua, luz o poda" 
            active={notifications.publicServices} 
            onToggle={() => toggleNotification('publicServices')}
          />
        </div>
      </section>

      {/* Privacy Section */}
      <section className="space-y-6">
        <header className="flex items-center gap-3 text-brand-ink mb-8">
          <div className="p-3 bg-slate-100 rounded-2xl text-slate-500">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-serif text-lg leading-tight">Privacidad</h4>
            <p className="text-xs text-brand-muted">Controla quién ve tu información.</p>
          </div>
        </header>

        <div className="editorial-card p-6 space-y-4">
          <div className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-4 -mx-4 rounded-2xl transition-all">
            <div className="flex items-center gap-4">
              <Eye size={18} className="text-slate-300" />
              <div>
                <p className="text-sm font-medium">Lectura de domicilio</p>
                <p className="text-[11px] text-brand-muted">Solo admins pueden ver mi casa</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-4 -mx-4 rounded-2xl transition-all">
            <div className="flex items-center gap-4">
              <Smartphone size={18} className="text-slate-300" />
              <div>
                <p className="text-sm font-medium">Verificación en dos pasos</p>
                <p className="text-[11px] text-brand-muted">Habilita mayor seguridad vía SMS</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      <div className="pt-6">
        <button 
          onClick={handleUpdateSettings}
          disabled={updating}
          className="w-full md:w-auto px-12 py-5 bg-brand-ink text-white rounded-full font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {updating ? <Loader2 className="animate-spin" size={18} /> : 'Guardar Todo'}
        </button>
      </div>
    </div>
  );
}

function SettingToggle({ label, sub, active, onToggle }: { label: string, sub: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-8">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-brand-muted">{sub}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-brand-primary' : 'bg-slate-200'}`}
      >
        <motion.div 
          animate={{ x: active ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
