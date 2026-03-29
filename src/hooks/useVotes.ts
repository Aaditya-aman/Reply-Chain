import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserVotes(chatId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['votes', chatId, user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('votes')
        .select('message_id, vote_type')
        .eq('user_id', user.id);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((v: { message_id: string; vote_type: number }) => { map[v.message_id] = v.vote_type; });
      return map;
    },
    enabled: !!user && !!chatId,
  });
}

export function useVote() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, voteType, currentVote }: { messageId: string; voteType: 1 | -1; currentVote?: number }) => {
      if (!user) throw new Error('Not authenticated');

      if (currentVote === voteType) {
        // Remove vote
        const { error } = await supabase.from('votes').delete().eq('message_id', messageId).eq('user_id', user.id);
        if (error) throw error;
      } else if (currentVote) {
        // Change vote
        const { error } = await supabase.from('votes').update({ vote_type: voteType }).eq('message_id', messageId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        // New vote
        const { error } = await supabase.from('votes').insert({ message_id: messageId, user_id: user.id, vote_type: voteType });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['votes'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
