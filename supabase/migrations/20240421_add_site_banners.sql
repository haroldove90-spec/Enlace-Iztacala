
-- Tabla para banners publicitarios globales
CREATE TABLE IF NOT EXISTS site_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  position TEXT DEFAULT 'header', -- 'header', 'sidebar', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de seguridad para site_banners
ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer banners activos
CREATE POLICY "Anyone can view active banners" 
ON site_banners FOR SELECT 
USING (is_active = true);

-- Solo administradores pueden insertar/actualizar/borrar
CREATE POLICY "Admins can manage banners" 
ON site_banners FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Habilitar tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE site_banners;
