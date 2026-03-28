import { useState, useRef, useCallback } from 'react';
import { Message } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useVote, useUserVotes } from '@/hooks/useVotes';
import { useTogglePin } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, MessageSquare, Pin, Share2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MessageItemProps {
  message: Message;
  allMessages: Message[];
  chatId: string;
  onReply: (msg: Message) => void;
  onThreadOpen?: (msgId: string) => void;
  userVotes: Record<string, number>;
  highlightId?: string;
}

export function MessageItem({ message, allMessages, chatId, onReply, onThreadOpen, userVotes, highlightId }: MessageItemProps) {
  const { user } = useAuth();
  const vote = useVote();
  const togglePin = useTogglePin();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const children = allMessages.filter(m => m.parent_id === message.id);
  const currentVote = userVotes[message.id];
  const isHighlighted = highlightId === message.id;
  const replyCount = children.length;
  const username = message.profiles?.username || 'unknown';
  const displayName = message.profiles?.display_name || username;
  const avatarUrl = message.profiles?.avatar_url;

  const handleVote = (type: 1 | -1) => {
    if (!user) return;
    vote.mutate({ messageId: message.id, voteType: type, currentVote });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/room/${chatId}/thread/${message.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Thread URL copied to clipboard' });
  };

  return (
    <div ref={ref} id={`msg-${message.id}`} className={cn('group', isHighlighted && 'highlight-pulse rounded-lg')}>
      <div className="flex gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
        {/* Vote controls */}
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <button
            onClick={() => handleVote(1)}
            className={cn('p-0.5 rounded hover:bg-accent transition-colors', currentVote === 1 && 'text-[hsl(var(--upvote))]')}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className={cn('text-xs font-medium tabular-nums', message.votes_count > 0 && 'text-[hsl(var(--upvote))]', message.votes_count < 0 && 'text-[hsl(var(--downvote))]')}>
            {message.votes_count}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className={cn('p-0.5 rounded hover:bg-accent transition-colors', currentVote === -1 && 'text-[hsl(var(--downvote))]')}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-[10px]">{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">@{username}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
            {message.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          </div>

          <p className="text-sm whitespace-pre-wrap break-words">{renderContent(message.content)}</p>

          {message.image_url && (
            <img src={message.image_url} alt="attachment" className="mt-2 max-w-sm rounded-lg border" />
          )}
          {message.attachment_url && !message.image_url && (
            <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              📎 {message.attachment_type || 'Download'}
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {message.depth < 3 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onReply(message)}>
                <MessageSquare className="h-3 w-3 mr-1" /> Reply
              </Button>
            )}
            {message.depth === 0 && onThreadOpen && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onThreadOpen(message.id)}>
                <ChevronRight className="h-3 w-3 mr-1" /> Thread
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleShare}>
              <Share2 className="h-3 w-3 mr-1" /> Share
            </Button>
            {user && (message.user_id === user.id || message.depth === 0) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => togglePin.mutate({ messageId: message.id, isPinned: message.is_pinned })}>
                <Pin className="h-3 w-3 mr-1" /> {message.is_pinned ? 'Unpin' : 'Pin'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Thread children */}
      {children.length > 0 && (
        <div className="thread-indent">
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="text-xs text-muted-foreground hover:text-foreground py-1">
              ▸ {replyCount} {replyCount === 1 ? 'reply' : 'replies'} (collapsed)
            </button>
          ) : (
            <>
              {children.length > 2 && (
                <button onClick={() => setCollapsed(true)} className="text-xs text-muted-foreground hover:text-foreground py-1 mb-1">
                  ▾ Collapse thread
                </button>
              )}
              {children.map(child => (
                <MessageItem
                  key={child.id}
                  message={child}
                  allMessages={allMessages}
                  chatId={chatId}
                  onReply={onReply}
                  onThreadOpen={onThreadOpen}
                  userVotes={userVotes}
                  highlightId={highlightId}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function renderContent(content: string) {
  // Highlight @mentions
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="font-medium text-primary cursor-pointer hover:underline">{part}</span>;
    }
    return part;
  });
}
