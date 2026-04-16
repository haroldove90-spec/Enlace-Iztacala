-- ===============================================================
-- FASE 2: SOCIAL GRAPH Y COMUNICACIÓN EN TIEMPO REAL
-- ===============================================================

-- 1. TIPOS PERSONALIZADOS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friendship_status') THEN
        CREATE TYPE friendship_status AS ENUM ('Pending', 'Accepted', 'Blocked');
    END IF;
END $$;

-- 2. TABLA DE AMISTADES
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status friendship_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicados y asegurar que no haya solicitudes a uno mismo
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id <> friend_id)
);

-- 3. TABLA DE MENSAJES (Chat Privado)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POLÍTICAS RLS PARA AMISTADES
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Ver amistades: Solo las propias
CREATE POLICY "Ver mis conexiones" 
ON public.friendships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Enviar solicitud: Solo por el usuario logueado
CREATE POLICY "Enviar solicitud propia" 
ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Aceptar/Rechazar: Solo el destinatario puede actualizar el estado
CREATE POLICY "Gestionar solicitudes recibidas" 
ON public.friendships FOR UPDATE 
USING (auth.uid() = friend_id)
WITH CHECK (auth.uid() = friend_id);

-- Borrar amistad: Cualquiera de los dos
CREATE POLICY "Eliminar conexión propia" 
ON public.friendships FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 5. POLÍTICAS RLS PARA MENSAJES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Ver mensajes: Solo remitente o destinatario
CREATE POLICY "Ver mis mensajes" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Enviar mensaje: Solo si son amigos (opcionalmente simplificado aquí para el demo)
CREATE POLICY "Enviar mensaje propio" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Marcar como leído
CREATE POLICY "Marcar como leído" 
ON public.messages FOR UPDATE 
USING (auth.uid() = recipient_id);

-- 6. HABILITAR TIEMPO REAL (WebSockets)
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ===============================================================
-- VISTAS ÚTILES PARA EL CHAT
-- ===============================================================
-- Vista para obtener el último mensaje y contador de no leídos
-- (Se puede implementar si es necesario para optimización)
