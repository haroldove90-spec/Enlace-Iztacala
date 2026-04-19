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

-- 4. Notificaciones para LIKES
CREATE OR REPLACE FUNCTION public.on_like_added()
RETURNS trigger AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Obtener el dueño del post
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = new.post_id;
  
  -- Solo notificar si el que da like no es el mismo dueño
  IF post_owner_id != new.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, content, source_id)
    VALUES (post_owner_id, new.user_id, 'like', 'reaccionó a tu publicación.', new.post_id);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_added_trigger ON public.likes;
CREATE TRIGGER on_like_added_trigger
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.on_like_added();

-- 5. Notificaciones para COMENTARIOS
CREATE OR REPLACE FUNCTION public.on_comment_added()
RETURNS trigger AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Obtener el dueño del post
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = new.post_id;
  
  -- Solo notificar si el que comenta no es el mismo dueño
  IF post_owner_id != new.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, content, source_id)
    VALUES (post_owner_id, new.user_id, 'comment', 'comentó en tu publicación.', new.post_id);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_added_trigger ON public.comments;
CREATE TRIGGER on_comment_added_trigger
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.on_comment_added();
