-- ===============================================================
-- FASE 3: GOBERNANZA, ROLES Y ECONOMÍA DEL DIRECTORIO
-- ===============================================================

-- 1. TIPOS DE ROLES
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('User', 'Business', 'Admin');
    END IF;
END $$;

-- 2. EXTENDER PERFILES CON ROLES Y ESTADO ACTIVO
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'User',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. TABLA DE PAGOS (Track de suscripciones de 100 MXN)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.business_directory(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) DEFAULT 100.00,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Paid', 'Failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 4. FUNCIÓN HELPER PARA ADMIN
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. POLÍTICAS RLS AVANZADAS

-- Pagos: Solo Admin ve todo, Negocios ven lo suyo
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve todos los pagos" 
ON public.payments FOR SELECT 
USING (is_admin());

CREATE POLICY "Negocios ven sus propios pagos" 
ON public.payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.business_directory 
    WHERE id = payments.business_id AND user_id = auth.uid()
  )
);

-- Profiles: Admin puede editar is_active y role
CREATE POLICY "Admin gestiona perfiles" 
ON public.profiles FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Business Directory: Refinar para que Admin pueda moderar
CREATE POLICY "Admin modera negocios" 
ON public.business_directory FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- 6. HABILITAR TIEMPO REAL PARA PAGOS
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
