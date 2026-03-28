import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.id;

  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!id,
  });
}

export function useProfileByUsername(username: string) {
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'username' | 'display_name' | 'bio' | 'avatar_url'>>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['profile', data.id] });
    },
  });
}
