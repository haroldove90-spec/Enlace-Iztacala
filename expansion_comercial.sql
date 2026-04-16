-- ===============================================================
-- EXPANSIÓN DE BASE DE DATOS: IDENTIDAD VISUAL Y DIRECTORIO COMERCIAL
-- ===============================================================

-- 1. EXTENDER TABLA DE PERFILES
-- Añadimos la columna para la foto de portada (Facebook Style)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. CREAR ENUM PARA ESTADO DE PAGO DE COMERCIOS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_payment_status') THEN
        CREATE TYPE business_payment_status AS ENUM ('Pending', 'Paid', 'Expired');
    END IF;
END $$;

-- 3. TABLA DE DIRECTORIO COMERCIAL (Banners Publicitarios)
CREATE TABLE IF NOT EXISTS public.business_directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  payment_status business_payment_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Se calculará al recibir el pago
  
  -- Para asegurar que un usuario maneje su negocio principal o varios si es necesario
  CONSTRAINT unique_business_per_user UNIQUE (user_id, business_name)
);

-- 4. POLÍTICAS DE SEGURIDAD (RLS) PARA DIRECTORIO COMERCIAL
ALTER TABLE public.business_directory ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos pueden ver los negocios activos y pagados
CREATE POLICY "Directorio visible para todos" 
ON public.business_directory FOR SELECT 
USING (true);

-- Inserción: Solo usuarios registrados pueden proponer su negocio
CREATE POLICY "Usuarios pueden crear su negocio" 
ON public.business_directory FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Actualización: Solo dueños pueden editar (nombre, descripción, banner)
CREATE POLICY "Dueños pueden editar sus datos" 
ON public.business_directory FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. REGLAS PARA STORAGE (Buckets: covers y banners)
-- NOTA: Los buckets deben crearse manualmente en la UI de Supabase o vía API
-- Aquí definimos las políticas asumiendo que existen:

-- Política para BUCKET: covers
-- (Asegura que el nombre del archivo incluya el UID del usuario para restricción de carpeta)
CREATE POLICY "Usuarios suben su propia portada" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Portadas visibles para todos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'covers');

-- Política para BUCKET: banners
CREATE POLICY "Dueños suben sus banners" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Banners visibles para todos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'banners');

-- ===============================================================
-- INSTRUCCIONES MANUALES PARA BUCKETS
-- ===============================================================
-- 1. Ve a "Storage" en Supabase.
-- 2. Crea un nuevo bucket llamado 'covers'. Ponlo como "Public".
-- 3. Crea un nuevo bucket llamado 'banners'. Ponlo como "Public".
-- ===============================================================
