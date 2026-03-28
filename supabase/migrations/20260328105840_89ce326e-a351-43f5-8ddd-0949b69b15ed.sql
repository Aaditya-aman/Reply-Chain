
-- Fix permissive mentions insert policy
DROP POLICY "Authenticated users can create mentions" ON public.mentions;
CREATE POLICY "Users can create mentions for own messages" ON public.mentions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.messages WHERE id = message_id AND user_id = auth.uid())
);

-- Fix permissive notifications insert policy
DROP POLICY "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.mentions mn JOIN public.messages m ON m.id = mn.message_id WHERE mn.mentioned_user_id = user_id AND m.user_id = auth.uid())
);
