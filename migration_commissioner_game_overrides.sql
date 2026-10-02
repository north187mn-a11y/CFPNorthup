-- Commissioner game-result overrides. ESPN refresh skips games while commissioner_override is true.
alter table public.games add column if not exists commissioner_override boolean not null default false;
alter table public.games add column if not exists override_winner_team_id text;
alter table public.games add column if not exists override_note text;
alter table public.games add column if not exists override_by uuid references public.profiles(id);
alter table public.games add column if not exists override_at timestamptz;
-- Production also includes game_override_audit plus set_game_override/clear_game_override RPCs; see Supabase migration history.