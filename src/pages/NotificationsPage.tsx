import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, MessageSquare, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6" /> Notifications
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : notifications.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No notifications yet</p>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={cn('cursor-pointer transition-colors hover:bg-accent/50', !n.read && 'border-primary/30 bg-accent/20')}
              onClick={() => !n.read && markRead.mutate(n.id)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                {n.type === 'reply' ? (
                  <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <AtSign className="h-4 w-4 text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {n.type === 'reply' ? 'Someone replied to your message' : 'You were mentioned in a message'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
