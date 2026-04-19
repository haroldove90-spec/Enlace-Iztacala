-- 1. Habilitar Realtime para tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.messages;

-- 2. Asegurar que RLS esté activado y permita lectura/escritura
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios leen sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios leen sus propias notificaciones" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios actualizan sus notificaciones" ON public.notifications;
CREATE POLICY "Usuarios actualizan sus notificaciones" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Trigger robusto para solicitudes de amistad
CREATE OR REPLACE FUNCTION public.on_friend_request_added()
RETURNS trigger AS $$
BEGIN
  -- Insertar notificación para el destinatario
  INSERT INTO public.notifications (user_id, actor_id, type, content, source_id)
  VALUES (
    new.friend_id, 
    new.user_id, 
    'friend_request', 
    'Quiere conectar contigo.', 
    new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_added_trigger ON public.friendships;
CREATE TRIGGER on_friend_request_added_trigger
AFTER INSERT ON public.friendships
FOR EACH ROW
WHEN (new.status = 'Pending')
EXECUTE FUNCTION public.on_friend_request_added();

-- 4. Trigger robusto para aceptación de amistad
CREATE OR REPLACE FUNCTION public.on_friend_request_accepted()
RETURNS trigger AS $$
BEGIN
  -- Insertar notificación para el remitente original (ahora el destinatario del cambio)
  -- 'new.user_id' es el que envió la solicitud original
  INSERT INTO public.notifications (user_id, actor_id, type, content, source_id)
  VALUES (
    new.user_id, 
    new.friend_id, 
    'friend_request', 
    'Aceptó tu solicitud de conexión.', 
    new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_accepted_trigger ON public.friendships;
CREATE TRIGGER on_friend_request_accepted_trigger
AFTER UPDATE ON public.friendships
FOR EACH ROW
WHEN (old.status = 'Pending' AND new.status = 'Accepted')
EXECUTE FUNCTION public.on_friend_request_accepted();
