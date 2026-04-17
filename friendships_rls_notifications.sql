-- 1. Habilitar RLS en friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Seguridad para friendships
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias amistades" ON public.friendships;
CREATE POLICY "Los usuarios pueden ver sus propias amistades"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Los usuarios pueden enviar solicitudes" ON public.friendships;
CREATE POLICY "Los usuarios pueden enviar solicitudes"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo el destinatario puede aceptar la solicitud" ON public.friendships;
CREATE POLICY "Solo el destinatario puede aceptar la solicitud"
ON public.friendships FOR UPDATE
USING (auth.uid() = friend_id AND status = 'Pending')
WITH CHECK (status = 'Accepted' OR status = 'Rejected');

DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus amistades" ON public.friendships;
CREATE POLICY "Los usuarios pueden eliminar sus amistades"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. Trigger para Notificación de Solicitud Aceptada
CREATE OR REPLACE FUNCTION public.handle_friendship_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar si el estado cambió de 'Pending' a 'Accepted'
    IF OLD.status = 'Pending' AND NEW.status = 'Accepted' THEN
        INSERT INTO public.notifications (user_id, actor_id, type, content)
        VALUES (
            NEW.user_id, -- El que envió la solicitud original
            NEW.friend_id, -- El que acaba de aceptar
            'friend_request_accepted',
            'ha aceptado tu solicitud de conexión. ¡Ahora pueden chatear!'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friendships;
CREATE TRIGGER on_friend_request_accepted
    AFTER UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_friendship_accepted();
