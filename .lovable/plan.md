
# ReplyChain — Reddit-Style Threaded Messaging App

## Overview
A structured messaging app where chat room conversations branch into nested, threaded discussions. Built with React/Vite/Tailwind + Supabase.

---

## Phase 1: Database Schema & Auth

### Supabase Tables
- **profiles** — id (FK auth.users), username (unique), display_name, avatar_url, bio, created_at
- **chat_rooms** — id, name, description, created_by, created_at
- **room_members** — id, room_id, user_id, joined_at
- **messages** — id, chat_id, parent_id (nullable, self-ref), user_id, content, image_url, attachment_url, attachment_type, is_pinned, votes_count, depth (0-3), created_at
- **votes** — id, message_id, user_id, vote_type (1/-1), unique(message_id, user_id)
- **mentions** — id, message_id, mentioned_user_id, created_at
- **notifications** — id, user_id, type (reply/mention), message_id, read, created_at

### Storage
- `avatars` bucket (public)
- `attachments` bucket (public)

### Auth
- Email/password signup & login
- Google OAuth (user configures in Supabase dashboard)
- Auto-create profile on signup via trigger
- Persistent sessions, protected routes

### RLS Policies
- Authenticated users can read all messages/rooms
- Users can only edit/delete their own messages and profiles
- Authenticated users can post, vote, upload

---

## Phase 2: Core UI Layout

### App Shell
- **Sidebar** — list of joined rooms, create room button, user avatar/menu at bottom
- **Main area** — room view with threaded messages
- **Header** — room name, search, pinned threads toggle

### Pages/Routes
- `/` — redirect to first room or onboarding
- `/login`, `/signup` — auth pages
- `/profile/:username` — user profile with posts/replies
- `/room/:roomId` — room chat view
- `/room/:roomId/thread/:messageId` — focused thread view

---

## Phase 3: Threaded Messaging (Core Feature)

- Root messages displayed chronologically or by votes
- Each message shows reply button → replies indent underneath (max depth 3-4)
- Expand/collapse thread branches
- Sort toggle: **Top** (by votes) / **New** (by date)
- Clicking a reply reference scrolls to parent with highlight animation
- Compose box at bottom for root messages; inline reply box for threads

---

## Phase 4: Voting System

- Upvote/downvote buttons on every message
- Optimistic UI updates
- `votes` table with unique constraint per user+message
- `votes_count` on messages updated via database trigger

---

## Phase 5: Pin & Share Threads

- Pin/unpin root messages (room creator or message author)
- Pinned messages section at top of room
- Each thread has a shareable URL (`/room/:id/thread/:msgId`)
- Thread focus mode loads full context

---

## Phase 6: Mentions System

- Type `@` in compose → autocomplete dropdown of room members
- Mentions stored in `mentions` table
- `@username` rendered as highlighted, clickable links
- Creates notification for mentioned user

---

## Phase 7: Attachments & Media

- Upload images (JPG, PNG) and files (PDF, DOCX, TXT) via Supabase Storage
- Preview before sending
- Images render inline; files show as download links
- Drag & drop support

---

## Phase 8: Search

- Search bar in room header
- Full-text search across messages in current room
- Results highlight matching text
- Filter by user optional

---

## Phase 9: Notifications

- Bell icon in header with unread count
- Notify when: someone replies to your message, you're mentioned
- Notifications dropdown with links to relevant threads
- Mark as read

---

## Phase 10: Profile Pages

- View profile at `/profile/:username`
- Edit own profile (display name, bio, avatar upload)
- Show user's recent messages and replies
- Avatar upload to `avatars` bucket

---

## Design Direction
- Clean, minimal Reddit-comment-style threading with clear indentation
- Mobile-first responsive layout
- Subtle animations: thread expand/collapse, reply highlight pulse
- Light theme default with dark mode toggle
- Consistent spacing and typography hierarchy
