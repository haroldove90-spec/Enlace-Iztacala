-- Esquema de Base de Datos para Enlace Iztacala
-- Diseñado para Supabase (PostgreSQL)

-- 1. Perfiles de Usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  dob DATE, -- Fecha de nacimiento
  bio TEXT,
  address_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Publicaciones
CREATE TYPE post_category AS ENUM ('Seguridad', 'Comercio', 'Social', 'Avisos');

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category post_category DEFAULT 'Social',
  location_lat DOUBLE PRECISION,
  location_long DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Comentarios
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Incidentes / Reportes
CREATE TYPE incident_status AS ENUM ('Reportado', 'En Proceso', 'Resuelto');

CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status incident_status DEFAULT 'Reportado',
  photo_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Función de Automatización de Perfiles
-- Se ejecuta cuando se crea un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, dob)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    (new.raw_user_meta_data->>'dob')::DATE
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para automatizar la inserción
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Políticas de Seguridad (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Perfiles: Solo el dueño puede editar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Perfiles: Todos pueden ver perfiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Posts: Todos pueden ver posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Posts: Solo usuarios autenticados pueden crear posts
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Posts: Solo el autor puede editar/borrar su post
CREATE POLICY "Authors can update/delete own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);

-- Incidentes: Solo el reportante o admins pueden ver/editar (Ejemplo simplificado)
CREATE POLICY "Users can see and manage own incidents" ON incidents
  FOR ALL USING (auth.uid() = user_id);
