import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Message {
  id: string;
  chat_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  image_url: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  is_pinned: boolean;
  votes_count: number;
  depth: number;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useMessages(chatId: string, sortBy: 'new' | 'top' = 'new') {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', chatId, sortBy],
    queryFn: async () => {
      let q = supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId);

      if (sortBy === 'top') {
        q = q.order('votes_count', { ascending: false });
      } else {
        q = q.order('created_at', { ascending: true });
      }

      const { data: messages, error } = await q;
      if (error) throw error;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((messages || []).map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

      return (messages || []).map((m: any) => ({
        ...m,
        profiles: profileMap[m.user_id] || null,
      })) as Message[];
    },
    enabled: !!chatId,
  });

  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, () => {
        qc.invalidateQueries({ queryKey: ['messages', chatId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId, qc]);

  return query;
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (msg: {
      chat_id: string;
      content: string;
      parent_id?: string;
      depth?: number;
      image_url?: string;
      attachment_url?: string;
      attachment_type?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: msg.chat_id,
          content: msg.content,
          parent_id: msg.parent_id || null,
          depth: msg.depth || 0,
          user_id: user.id,
          image_url: msg.image_url || null,
          attachment_url: msg.attachment_url || null,
          attachment_type: msg.attachment_type || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['messages', data.chat_id] });
    },
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      const { error } = await supabase.from('messages').update({ is_pinned: !isPinned }).eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  });
}
