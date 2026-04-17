
-- 1. TIPOS DE NOTIFICACIÓN
DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM ('friend_request', 'message', 'like', 'comment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type public.notification_type NOT NULL,
    is_read BOOLEAN DEFAULT false,
    content TEXT,
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SEGURIDAD (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Permitir inserción por el sistema/triggers
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- 4. TIEMPO REAL
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 5. TRIGGER PARA SOLICITUDES DE AMISTAD
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el estado es 'Pending'
    IF (NEW.status = 'Pending') THEN
        INSERT INTO public.notifications (user_id, actor_id, type, source_id)
        VALUES (NEW.friend_id, NEW.user_id, 'friend_request', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_added ON public.friendships;
CREATE TRIGGER on_friend_request_added
    AFTER INSERT ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

-- 6. TRIGGER PARA MENSAJES
CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, type, source_id, content)
    VALUES (NEW.recipient_id, NEW.sender_id, 'message', NEW.id, NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_added ON public.messages;
CREATE TRIGGER on_message_added
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.notify_message();
