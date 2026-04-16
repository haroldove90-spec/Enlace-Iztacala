-- ===============================================================
-- INTERACCIONES SOCIALES Y MULTIMEDIA - ENLACE IZTACALA
-- ===============================================================

-- 1. TABLA DE LIKES
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id) -- Un solo like por usuario por post
);

-- 2. TABLA DE COMENTARIOS
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POLÍTICAS RLS PARA LIKES
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Insertar likes propios" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Borrar likes propios" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 4. POLÍTICAS RLS PARA COMENTARIOS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de comentarios" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Insertar comentarios propios" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Borrar comentarios propios" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 5. ACTUALIZACIÓN DE TIEMPO REAL
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 6. INSTRUCCIONES DE STORAGE (Buckets)
-- Importante: Los buckets se crean desde la UI de Supabase (Storage > Buckets).
-- 1. Crea el bucket 'post-assets' (Público)
-- 2. Crea el bucket 'avatars' (Público)

/*
Políticas sugeridas para Storage (en la UI de Supabase):
Bucket 'post-assets':
- SELECT: true (all users)
- INSERT: auth.role() == 'authenticated' && (storage.foldername(name))[1] == auth.uid()
- DELETE: auth.uid() == (storage.foldername(name))[1]

Bucket 'avatars':
- SELECT: true (all users)
- INSERT/UPDATE: auth.uid() == (storage.foldername(name))[1]
*/
