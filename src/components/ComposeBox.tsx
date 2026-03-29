import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ComposeBoxProps {
  chatId: string;
  parentId?: string;
  parentDepth?: number;
  onSend: (msg: { content: string; image_url?: string; attachment_url?: string; attachment_type?: string }) => void;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function ComposeBox({ chatId, parentId, parentDepth, onSend, onCancel, placeholder, compact }: ComposeBoxProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('attachments').upload(path, file);
    setUploading(false);
    if (error) return;
    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(data.path);
    const isImage = file.type.startsWith('image/');
    setPreview({ url: urlData.publicUrl, type: isImage ? 'image' : file.type, name: file.name });
  };

  const handleSubmit = () => {
    if (!content.trim() && !preview) return;
    const msg: { content: string; image_url?: string; attachment_url?: string; attachment_type?: string } = { content: content.trim() };
    if (preview) {
      if (preview.type === 'image') {
        msg.image_url = preview.url;
      } else {
        msg.attachment_url = preview.url;
        msg.attachment_type = preview.name;
      }
    }
    onSend(msg);
    setContent('');
    setPreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && onCancel) onCancel();
  };

  return (
    <div className={cn('border rounded-lg bg-card', compact ? 'p-2' : 'p-3')}>
      {preview && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded">
          {preview.type === 'image' ? (
            <img src={preview.url} alt="preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <span className="text-sm">📎 {preview.name}</span>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setPreview(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      {onCancel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Replying to thread</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onCancel}>Cancel</Button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Write a message...'}
          className={cn('min-h-[40px] resize-none', compact && 'text-sm')}
          rows={1}
        />
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,.pdf,.docx,.txt" />
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button size="icon" className="shrink-0" onClick={handleSubmit} disabled={!content.trim() && !preview}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
