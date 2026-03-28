import { useRooms } from '@/hooks/useRooms';
import { Navigate } from 'react-router-dom';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { data: rooms = [], isLoading } = useRooms();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to first room if available
  if (rooms.length > 0) {
    return <Navigate to={`/room/${rooms[0].id}`} replace />;
  }

  // Onboarding
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
        <MessageSquare className="h-8 w-8 text-primary-foreground" />
      </div>
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Welcome to ReplyChain</h1>
        <p className="text-muted-foreground">
          Create your first room to start organized, threaded conversations. No more chaotic group chats!
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Use the <Plus className="inline h-3.5 w-3.5" /> button in the sidebar to create a room.
      </p>
    </div>
  );
}
