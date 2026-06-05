-- NexSend — Supabase Database Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the rooms table
create table if not exists public.rooms (
  code text primary key,
  created_at bigint not null,
  expires_at bigint not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete set null,
  sender_connected boolean not null default true,
  receiver_connected boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting','connected','transferring','completed','expired')),
  files jsonb not null default '[]'::jsonb
);

create index if not exists rooms_expires_at_idx on public.rooms (expires_at);
create index if not exists rooms_sender_id_idx on public.rooms (sender_id);

-- 2. Enable Row Level Security
alter table public.rooms enable row level security;

-- 3. Policies
-- Anyone authenticated can read rooms
create policy "rooms_read_authenticated"
  on public.rooms for select
  to authenticated
  using (true);

-- Authenticated users can create rooms
create policy "rooms_insert_authenticated"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Sender or receiver can update the room
create policy "rooms_update_participants"
  on public.rooms for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Only sender can delete
create policy "rooms_delete_sender"
  on public.rooms for delete
  to authenticated
  using (auth.uid() = sender_id);

-- 4. Enable Realtime for the rooms table
alter publication supabase_realtime add table public.rooms;

-- 5. Storage bucket for file transfers
-- Create a private bucket called 'transfers'
insert into storage.buckets (id, name, public)
values ('transfers', 'transfers', false)
on conflict (id) do nothing;

-- 6. Storage policies
-- Authenticated users can upload to rooms/{roomCode}/
create policy "transfers_upload_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'transfers' and (storage.foldername(name))[1] ~ '^\d{6}$');

-- Authenticated users can read files
create policy "transfers_read_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'transfers');

-- Authenticated users can delete their own files
create policy "transfers_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'transfers');

-- 7. Auto-cleanup expired rooms (runs hourly)
-- Optional: enable pg_cron extension and schedule cleanup
-- create extension if not exists pg_cron;
-- select cron.schedule('cleanup-expired-rooms', '0 * * * *', $$
--   delete from public.rooms where expires_at < extract(epoch from now()) * 1000;
-- $$);
