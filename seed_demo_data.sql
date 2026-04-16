-- ===============================================================
-- ESTRUCTURA Y DATOS DE MUESTRA VECINALES PARA ENLACE IZTACALA
-- ===============================================================

-- 1. LIMPIEZA TOTAL
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS post_category CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;

-- 2. TIPOS PERSONALIZADOS
CREATE TYPE post_category AS ENUM ('Seguridad', 'Comercio', 'Social', 'Avisos');
CREATE TYPE incident_status AS ENUM ('Reportado', 'En Proceso', 'Resuelto');

-- 3. TABLA DE PERFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY, -- Compatible con Auth pero flexible para datos Mock
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  address_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE PUBLICACIONES
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category post_category DEFAULT 'Avisos',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE REPORTES / INCIDENTES
CREATE TABLE public.incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status incident_status DEFAULT 'Reportado',
  photo_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DATOS DE MUESTRA (LOS REYES IZTACALA)
INSERT INTO public.profiles (id, username, full_name, bio, address_verified)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'dr_mendoza', 'Dr. Roberto Mendoza', 'Médico jubilado. Vecino de Los Reyes desde hace 30 años. Seguridad ante todo.', true),
  ('b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 'elena_v', 'Maestra Elena Vázquez', 'Docente de primaria. Amo nuestra colonia y los parques limpios.', true),
  ('c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 'artesano_pan', 'Panadería El Artesano', 'Pan artesanal frente al Parque Central. Tradición en Iztacala.', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.posts (user_id, content, category)
VALUES 
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 
    'Vecinos, aviso que el ayuntamiento ya recibió el reporte de luminarias en la Av. de los Reyes. Vienen el miércoles.', 
    'Seguridad'
  ),
  (
    'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 
    '¿Ya probaron nuestras conchas de chocolate amargo? 4x3 para vecinos hoy presentando su app.', 
    'Comercio'
  ),
  (
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 
    'Jornada de limpieza del Parque Central este domingo 9:00 AM. ¡Traigan bolsas!', 
    'Social'
  );

INSERT INTO public.incidents (user_id, title, description, status, location)
VALUES 
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 
    'Fuga de Agua Potable', 
    'Fuga considerable en la calle de los Monarcas #14. Urge atención.', 
    'Reportado', 
    'Calle de los Monarcas #14'
  ),
  (
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 
    'Recolección de Basura', 
    'El camión de basura ya completó la ruta en Plaza Central.', 
    'Resuelto', 
    'Plaza Central'
  );

-- 7. AUTOSINCRONIZACIÓN DE USUARIOS REALES (TRIGGER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública" ON profiles FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON posts FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON incidents FOR SELECT USING (true);

CREATE POLICY "Update propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insertar posts autenticados" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Insertar reportes autenticados" ON incidents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. HABILITAR TIEMPO REAL
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
