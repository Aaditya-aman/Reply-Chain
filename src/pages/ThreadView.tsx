import { useParams, useNavigate } from 'react-router-dom';
import { useMessages, useSendMessage, Message } from '@/hooks/useMessages';
import { useUserVotes } from '@/hooks/useVotes';
import { MessageItem } from '@/components/MessageItem';
import { ComposeBox } from '@/components/ComposeBox';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

export default function ThreadView() {
  const { roomId, messageId } = useParams<{ roomId: string; messageId: string }>();
  const navigate = useNavigate();
  const { data: messages = [] } = useMessages(roomId || '');
  const { data: userVotes = {} } = useUserVotes(roomId || '');
  const sendMessage = useSendMessage();
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  if (!roomId || !messageId) return null;

  const rootMsg = messages.find(m => m.id === messageId);

  const handleSend = (msg: { content: string; image_url?: string }) => {
    const parent = replyTo || rootMsg;
    if (!parent) return;
    sendMessage.mutate({
      chat_id: roomId,
      content: msg.content,
      parent_id: parent.id,
      depth: Math.min((parent.depth || 0) + 1, 3),
      image_url: msg.image_url,
    });
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/room/${roomId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold">Thread</h2>
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        {rootMsg && (
          <MessageItem
            message={rootMsg}
            allMessages={messages}
            chatId={roomId}
            onReply={setReplyTo}
            userVotes={userVotes}
          />
        )}
      </ScrollArea>

      <div className="border-t bg-card px-4 py-3">
        <ComposeBox
          chatId={roomId}
          onSend={handleSend}
          onCancel={replyTo ? () => setReplyTo(null) : undefined}
          placeholder="Reply to thread..."
          compact
        />
      </div>
    </div>
  );
}
