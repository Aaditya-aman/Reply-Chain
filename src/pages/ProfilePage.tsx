import { useParams, useNavigate } from 'react-router-dom';
import { useProfileByUsername, useUpdateProfile, Profile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfileByUsername(username || '');
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isOwn = user?.id === profile?.id;

  const startEdit = () => {
    if (!profile) return;
    setDisplayName(profile.display_name || '');
    setBio(profile.bio || '');
    setEditing(true);
  };

  const handleSave = async () => {
    await updateProfile.mutateAsync({ display_name: displayName, bio });
    setEditing(false);
    toast({ title: 'Profile updated' });
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateProfile.mutateAsync({ avatar_url: data.publicUrl });
    toast({ title: 'Avatar updated' });
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!profile) return <div className="flex items-center justify-center h-full text-muted-foreground">User not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{profile.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {isOwn && (
                <>
                  <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleAvatar} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                </>
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{profile.display_name || profile.username}</CardTitle>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
            {isOwn && !editing && (
              <Button variant="outline" size="sm" onClick={startEdit}>Edit Profile</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateProfile.isPending}>Save</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm">{profile.bio || 'No bio yet.'}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
