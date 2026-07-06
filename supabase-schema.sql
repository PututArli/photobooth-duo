-- ============================================================
-- PhotoBooth Duo — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. ROOMS table
create table if not exists rooms (
  id          uuid primary key default gen_random_uuid(),
  room_code   text not null unique,
  status      text not null default 'waiting' check (status in ('waiting', 'active', 'done')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '30 minutes')
);

-- Index for fast lookup by code
create index if not exists idx_rooms_code on rooms(room_code);
create index if not exists idx_rooms_expires on rooms(expires_at);
create index if not exists idx_rooms_created_at on rooms(created_at);

-- 2. ROOM PARTICIPANTS table
create table if not exists room_participants (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references rooms(id) on delete cascade,
  participant_id  text not null,
  role            text not null check (role in ('host', 'guest')),
  joined_at       timestamptz not null default now(),
  unique(room_id, participant_id)
);

create index if not exists idx_participants_room on room_participants(room_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table rooms enable row level security;
alter table room_participants enable row level security;

-- Rooms: Anyone can read and insert (anon)
create policy "rooms_select" on rooms
  for select using (true);

create policy "rooms_insert" on rooms
  for insert with check (true);

create policy "rooms_update" on rooms
  for update using (true);

create policy "rooms_delete" on rooms
  for delete using (true);

-- Participants: Anyone can read and insert
create policy "participants_select" on room_participants
  for select using (true);

create policy "participants_insert" on room_participants
  for insert with check (true);

-- ============================================================
-- Auto-cleanup expired rooms (optional, run as cron via pg_cron)
-- or handle in API
-- ============================================================

-- Optional: function to clean expired rooms
create or replace function cleanup_expired_rooms()
returns void language plpgsql as $$
begin
  delete from rooms where expires_at < now();
end;
$$;

-- ============================================================
-- Realtime: Enable realtime for rooms table
-- (Also enable via Supabase Dashboard > Database > Replication)
-- ============================================================

-- Grant realtime access to anon role
grant usage on schema public to anon, authenticated;
grant all on rooms to anon, authenticated;
grant all on room_participants to anon, authenticated;
