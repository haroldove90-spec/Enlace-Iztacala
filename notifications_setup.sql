-- 1. Asegurar tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('friend_request', 'message', 'like', 'comment')),
    is_read BOOLEAN DEFAULT FALSE,
    content TEXT,
    source_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Políticas
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Triggers para Generar Notificaciones Automáticas

-- Trigger para LIKE
CREATE OR REPLACE FUNCTION notify_like()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    
    -- No auto-notificar si el autor le da like a su propio post
    IF post_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, source_id, content)
        VALUES (post_author_id, NEW.user_id, 'like', NEW.post_id, 'ha reaccionado a tu publicación.');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION notify_like();

-- Trigger para COMENTARIO
CREATE OR REPLACE FUNCTION notify_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    
    IF post_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, source_id, content)
        VALUES (post_author_id, NEW.user_id, 'comment', NEW.post_id, NEW.content);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION notify_comment();

-- Trigger para MENSAJES (Buzón de avisos)
CREATE OR REPLACE FUNCTION notify_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, type, source_id, content)
    VALUES (NEW.recipient_id, NEW.sender_id, 'message', NEW.id, NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION notify_message();

-- Trigger para SOLICITUD DE AMISTAD
CREATE OR REPLACE FUNCTION notify_friendship()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pendiente' THEN
        INSERT INTO public.notifications (user_id, actor_id, type, source_id, content)
        VALUES (NEW.friend_id, NEW.user_id, 'friend_request', NEW.id, 'quiere conectar contigo.');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friendship_created ON public.friendships;
CREATE TRIGGER on_friendship_created
    AFTER INSERT ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION notify_friendship();

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
