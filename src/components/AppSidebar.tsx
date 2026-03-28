import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRooms, useCreateRoom, ChatRoom } from '@/hooks/useRooms';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Bell, LogOut, User, Hash } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { data: rooms = [] } = useRooms();
  const { data: profile } = useProfile();
  const { data: notifications = [] } = useNotifications();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  const createRoom = useCreateRoom();
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    const room = await createRoom.mutateAsync({ name: newRoomName, description: newRoomDesc || undefined });
    setNewRoomName('');
    setNewRoomDesc('');
    setDialogOpen(false);
    navigate(`/room/${room.id}`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg">ReplyChain</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Rooms</span>
            {!collapsed && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-accent transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g. Study Group" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} placeholder="What's this room about?" />
                    </div>
                    <Button onClick={handleCreateRoom} className="w-full" disabled={!newRoomName.trim()}>
                      Create Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {rooms.map((room) => (
                <SidebarMenuItem key={room.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/room/${room.id}`}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="truncate">{room.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {rooms.length === 0 && !collapsed && (
                <p className="text-xs text-muted-foreground px-2 py-4">No rooms yet. Create one!</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        <SidebarMenuButton asChild>
          <NavLink to="/notifications" className="hover:bg-muted/50 flex items-center" activeClassName="bg-accent">
            <Bell className="mr-2 h-4 w-4" />
            {!collapsed && <span>Notifications</span>}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-5 px-1">
                {unreadCount}
              </Badge>
            )}
          </NavLink>
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          <NavLink to={`/profile/${profile?.username || ''}`} className="hover:bg-muted/50 flex items-center" activeClassName="bg-accent">
            <Avatar className="h-5 w-5 mr-2">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            {!collapsed && <span className="truncate">{profile?.display_name || profile?.username || 'Profile'}</span>}
          </NavLink>
        </SidebarMenuButton>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && 'Sign out'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
