-- FINAL AND ROBUST NOTIFICATIONS SETUP
-- ENSURE THIS RUNS IN SUPABASE SQL EDITOR

-- 1. Create table if not exists with correct relations
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    content TEXT,
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 2. Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" ON public.notifications 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications 
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Utility Functions for Triggers
CREATE OR REPLACE FUNCTION public.handle_new_notification(
    p_user_id UUID,
    p_actor_id UUID,
    p_type VARCHAR,
    p_content TEXT,
    p_source_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Evitar notificaciones a uno mismo
    IF p_user_id = p_actor_id THEN
        RETURN;
    END IF;

    INSERT INTO public.notifications (user_id, actor_id, type, content, source_id)
    VALUES (p_user_id, p_actor_id, p_type, p_content, p_source_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Triggers Logic

-- NOTIFY LIKE
CREATE OR REPLACE FUNCTION public.notify_on_like() RETURNS TRIGGER AS $$
DECLARE
    v_target_user_id UUID;
BEGIN
    SELECT user_id INTO v_target_user_id FROM public.posts WHERE id = NEW.post_id;
    IF v_target_user_id IS NOT NULL THEN
        PERFORM public.handle_new_notification(v_target_user_id, NEW.user_id, 'like', 'le dio like a tu publicación', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_like ON public.likes;
CREATE TRIGGER tr_notify_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- NOTIFY COMMENT
CREATE OR REPLACE FUNCTION public.notify_on_comment() RETURNS TRIGGER AS $$
DECLARE
    v_target_user_id UUID;
BEGIN
    SELECT user_id INTO v_target_user_id FROM public.posts WHERE id = NEW.post_id;
    IF v_target_user_id IS NOT NULL THEN
        PERFORM public.handle_new_notification(v_target_user_id, NEW.user_id, 'comment', NEW.content, NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_comment ON public.comments;
CREATE TRIGGER tr_notify_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- NOTIFY MESSAGE
CREATE OR REPLACE FUNCTION public.notify_on_message() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.handle_new_notification(NEW.recipient_id, NEW.sender_id, 'message', NEW.content, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_message ON public.messages;
CREATE TRIGGER tr_notify_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- NOTIFY FRIEND REQUEST
CREATE OR REPLACE FUNCTION public.notify_on_friendship() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Pending' THEN
        PERFORM public.handle_new_notification(NEW.friend_id, NEW.user_id, 'friend_request', 'quiere conectar contigo', NEW.id);
    ELSIF NEW.status = 'Accepted' AND OLD.status = 'Pending' THEN
        PERFORM public.handle_new_notification(NEW.user_id, NEW.friend_id, 'friend_request', 'aceptó tu solicitud de conexión', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_friendship ON public.friendships;
CREATE TRIGGER tr_notify_friendship AFTER UPDATE OR INSERT ON public.friendships FOR EACH ROW EXECUTE FUNCTION notify_on_friendship();

-- 5. Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
