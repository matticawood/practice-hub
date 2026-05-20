-- Guest join-request queue for live events.
-- When an external guest (via invite link) or a member wants to join backstage,
-- they create a pending row here. The host approves or rejects it.
-- On approval the edge function writes the Daily.co token into this row and
-- the guest's browser picks it up via postgres_changes subscription.

create table if not exists event_guest_requests (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references live_events(id) on delete cascade,
  invite_token text,                        -- set for external guests (guest-join.html)
  guest_name   text not null,
  status       text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  daily_token  text,                        -- filled on approval
  room_url     text,                        -- filled on approval
  created_at   timestamptz not null default now()
);

-- Guests subscribe by request id via postgres_changes (anon key) so they need read access.
alter table event_guest_requests enable row level security;

create policy "Anyone can read guest requests"
  on event_guest_requests for select
  using (true);

-- All inserts/updates go through the edge function with the service key (bypasses RLS).
