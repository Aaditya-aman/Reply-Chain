import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export function useRooms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ChatRoom[];
    },
    enabled: !!user,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({ name, description, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      // Auto-join the room
      await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id });
      return room as ChatRoom;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId)
        .eq('created_by', user.id); // Ensure only creator can delete
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useJoinRoom() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('room_members').insert({ room_id: roomId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useRoomMembers(roomId: string) {
  return useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_members')
        .select('user_id, profiles(*)')
        .eq('room_id', roomId);
      if (error) throw error;
      return (data || []).map((m: any) => m.profiles);
    },
    enabled: !!roomId,
  });
}
