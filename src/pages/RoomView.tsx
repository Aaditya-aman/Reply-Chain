import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages, useSendMessage, Message } from '@/hooks/useMessages';
import { useUserVotes } from '@/hooks/useVotes';
import { MessageItem } from '@/components/MessageItem';
import { ComposeBox } from '@/components/ComposeBox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pin, ArrowUpDown, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RoomView() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [search, setSearch] = useState('');

  const { data: messages = [], isLoading } = useMessages(roomId || '', sortBy);
  const { data: userVotes = {} } = useUserVotes(roomId || '');
  const sendMessage = useSendMessage();

  if (!roomId) return null;

  const rootMessages = messages.filter(m => !m.parent_id);
  const pinnedMessages = messages.filter(m => m.is_pinned);
  const filteredMessages = search
    ? rootMessages.filter(m => m.content.toLowerCase().includes(search.toLowerCase()))
    : rootMessages;

  const handleSend = (msg: { content: string; image_url?: string; attachment_url?: string; attachment_type?: string }) => {
    sendMessage.mutate({
      chat_id: roomId,
      content: msg.content,
      parent_id: replyTo?.id,
      depth: replyTo ? Math.min((replyTo.depth || 0) + 1, 3) : 0,
      image_url: msg.image_url,
      attachment_url: msg.attachment_url,
      attachment_type: msg.attachment_type,
    });
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <Button
          variant={showPinned ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowPinned(!showPinned)}
          className="gap-1"
        >
          <Pin className="h-3.5 w-3.5" />
          Pinned ({pinnedMessages.length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortBy(s => s === 'new' ? 'top' : 'new')}
          className="gap-1"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === 'new' ? 'New' : 'Top'}
        </Button>
      </div>

      {/* Pinned section */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="border-b bg-accent/30 px-4 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Pin className="h-3 w-3" /> Pinned Messages
          </p>
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="text-sm py-1 px-2 rounded hover:bg-accent cursor-pointer" onClick={() => {
              const el = document.getElementById(`msg-${msg.id}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}>
              <span className="font-medium">{msg.profiles?.username}</span>: {msg.content.slice(0, 80)}
              {msg.content.length > 80 && '...'}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation below</p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <MessageItem
              key={msg.id}
              message={msg}
              allMessages={messages}
              chatId={roomId}
              onReply={setReplyTo}
              onThreadOpen={(msgId) => navigate(`/room/${roomId}/thread/${msgId}`)}
              userVotes={userVotes}
            />
          ))
        )}
      </ScrollArea>

      {/* Compose */}
      <div className="border-t bg-card px-4 py-3">
        <ComposeBox
          chatId={roomId}
          parentId={replyTo?.id}
          parentDepth={replyTo?.depth}
          onSend={handleSend}
          onCancel={replyTo ? () => setReplyTo(null) : undefined}
          placeholder={replyTo ? `Reply to @${replyTo.profiles?.username}...` : 'Write a message...'}
        />
      </div>
    </div>
  );
}
